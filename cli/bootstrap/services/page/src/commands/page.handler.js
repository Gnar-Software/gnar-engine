import { commands, logger, error, storage } from '@gnar-engine/core';
import { page } from '../services/page.service.js';
import { config } from '../config.js';
import { validatePage } from '../schema/page.schema.js';
import { rebuild } from '../services/rebuild.service.js';

/**
 * Get single page
 */
commands.register('pageService.getSinglePage', async ({id}) => {
    if (id) {
        return await page.getById({id: id});
    } else {
        throw new error.badRequest('Page email or id required');
    }
}, {
    description: 'Get one page by id.',
    parameters: {
        id: { type: ['string', 'number'], description: 'Page ID' }
    }
});

/**
 * Get many pages
 */
commands.register('pageService.getManyPages', async ({ pageSize, pageNum } = {}) => {
    return await page.getAll({ pageSize, pageNum });
}, {
    description: 'Get a paginated list of pages.',
    parameters: {
        pageSize: { type: 'number', description: 'Number of pages per page' },
        pageNum: { type: 'number', description: 'Page number' }
    }
});

/**
 * Create pages
 */
commands.register('pageService.createPages', async ({ pages, requestUser }) => {
    const validationErrors = [];
    const createdNewPages = [];

    for (const newData of pages) {
            const { errors } = validatePage(newData);
            if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        const processedData = await commands.execute('pageService.processUploadsInData', {
            data: newData,
            requestUser,
        });

        const created = await page.create(processedData);
        createdNewPages.push(created);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid page data: ${validationErrors}`);
    }

    return createdNewPages;
}, {
    description: 'Create one or more pages.',
    parameters: {
        pages: {
            type: 'array',
            description: 'Pages to create. Page object details are available in pageService.pageSchema.'
        },
        requestUser: { type: 'object', description: 'Authenticated user performing the request' }
    }
});


/**
 * Update page
 */
commands.register('pageService.updatePage', async ({id, newPageData, requestUser}) => {

    const validationErrors = [];

    if (!id) {
        throw new error.badRequest('Page ID required');

    }

    const obj = await page.getById({id: id});

    if (!obj) {
        throw new error.notFound('Page not found');
    }

    delete newPageData.id;

    const { errors } = validatePage(newPageData);

    if (errors?.length) {
        validationErrors.push(errors);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid page data: ${validationErrors}`);
    }

    newPageData = await commands.execute('pageService.processUploadsInData', { data: newPageData, requestUser });

    // trigger rebuild if required
    if (config.rebuilds.pathBased.enabled) {
        rebuild.path({
            pageKey: newPageData.key
        })
    }

    return await page.update({
        id: id,
        updatedData: newPageData
    });
}, {
    description: 'Update one page by id.',
    parameters: {
        id: { type: ['string', 'number'], description: 'Page ID' },
        newPageData: { type: 'object', description: 'Page update data. Fields are available in pageService.pageSchema.' },
        requestUser: { type: 'object', description: 'Authenticated user performing the request' }
    }
});

/**
 * Delete page
 */
commands.register('pageService.deletePage', async ({id}) => {
    const obj = await page.getById({id: id});
    if (!obj) {
        throw new error.notFound('Page not found');
    }
    return await page.delete({id: id});
}, {
    description: 'Delete one page by id.',
    parameters: {
        id: { type: ['string', 'number'], description: 'Page ID' }
    }
});


/**
 * Find file and image uploads and store them
 *
 * @param {Object} data - The data object to search for files/images
 * @param {Function} uploadFn - Function to handle the actual upload process
 * @returns {Object} - The updated data object with stored file/image references
 */
commands.register('pageService.processUploadsInData', async ({ data, requestUser }) => {

    const uploadFilesRecursive = async (data) => {
        if (Array.isArray(data)) {
            return Promise.all(data.map(item => uploadFilesRecursive(item)));
        } else if (data && typeof data === 'object') {
            const result = { ...data };

            for (const [key, value] of Object.entries(data)) {
                if (key === 'file' && typeof value === 'string') {

                    logger.info('Processing file upload in page data');

                    // Filename
                    const fileName = result.fileName || `upload_${Date.now()}`;

                    // Mime type
                    let mimeType = result.mimeType;
                    let base64Data = value;

                    const matches = value.match(/^data:(.+);base64,(.+)$/);
                    if (matches) {
                        mimeType = mimeType || matches[1];
                        base64Data = matches[2];
                    }

                    if (!mimeType) mimeType = 'application/octet-stream';

                    // Upload
                    const url = await storage.upload({
                        file: Buffer.from(base64Data, 'base64'),
                        key: 'public/page-content/' + fileName,
                        contentType: mimeType,
                        metadata: {
                            uploadedAt: new Date().toISOString(),
                            uploadedBy: requestUser ? requestUser.id : 'unknown'
                        }
                    });

                    // Add url and remove upload keys
                    result.url = url;
                    delete result.file;
                    if (result.fileName) delete result.fileName;
                    if (result.mimeType) delete result.mimeType;

                } else {
                    result[key] = await uploadFilesRecursive(value);
                }
            }

            return result;
        }

        return data;
    };

    return await uploadFilesRecursive(data);
}, {
    description: 'Process base64 file uploads embedded in page data and replace them with stored file URLs.',
    parameters: {
        data: { type: ['object', 'array'], description: 'Page or block data containing upload fields' },
        requestUser: { type: 'object', description: 'Authenticated user performing the upload' }
    }
});

commands.register("pageService.exportPages", async () => {
    const pagesData = (await page.getAll({ pageSize: 999999, pageNum: 1 })).data;

    const payload = {
        exportedAt: new Date().toISOString(),
        pages: pagesData,
    };

    const jsonString = JSON.stringify(payload, null, 2);

    await page.writeBackup({
        fileName: "pages.json",
        contents: jsonString
    });

    return {
        fileName: "pages.json",
        jsonString,
    };
}, {
    description: 'Export all pages to a JSON backup file.',
    parameters: {}
});

commands.register("pageService.exportBlocks", async () => {
    const pagesData = (await page.getAll({ pageSize: 999999, pageNum: 1 })).data;

    const blocks = pagesData.flatMap((p) =>
        (p.blocks || []).map((b) => ({
        pageKey: p.key,
        pageId: p.id,
        block: b,
        }))
    );

    const payload = {
        exportedAt: new Date().toISOString(),
        blocks,
    };

    const jsonString = JSON.stringify(payload, null, 2);

    await page.writeBackup({
        fileName: "blocks.json",
        contents: jsonString
    });

    return {
        fileName: "blocks.json",
        jsonString,
    };
}, {
    description: 'Export page-embedded blocks to a JSON backup file.',
    parameters: {}
});

commands.register("pageService.importPages", async ({ pages: incomingPages, requestUser }) => {
    if (!Array.isArray(incomingPages)) {
        throw new error.badRequest("Import expects { pages: [...] }");
    }

    const existing = (await page.getAll({ pageSize: 999999, pageNum: 1 })).data;
    const byKey = new Map(existing.filter(p => p?.key).map(p => [p.key, p]));

    const result = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const incomingRaw of incomingPages) {
        try {
        if (!incomingRaw?.key) {
            result.skipped++;
            continue;
        }

        // Never trust incoming id
        const { id, ...incoming } = incomingRaw;

        // Validate (optional but recommended)
        const { errors: validationErrors } = validatePage(incoming);
        if (validationErrors?.length) {
            result.errors.push({ key: incoming.key, message: `Validation failed: ${validationErrors}` });
            continue;
        }

        // Process uploads if the import contains base64 "file" fields
        const processed = await commands.execute("pageService.processUploadsInData", {
            data: incoming,
            requestUser,
        });

        const found = byKey.get(processed.key);

        if (found) {
            await page.update({
            id: found.id,
            updatedData: processed,
            });
            result.updated++;
        } else {
            await page.create(processed);
            result.created++;
        }
        } catch (e) {
        result.errors.push({ key: incomingRaw?.key, message: e?.message || String(e) });
        }
    }

    return result;
}, {
    description: 'Import pages from JSON data, creating new pages or updating existing pages by key.',
    parameters: {
        pages: {
            type: 'array',
            description: 'Pages to import. Page object details are available in pageService.pageSchema.'
        },
        requestUser: { type: 'object', description: 'Authenticated user performing the import' }
    }
});

commands.register("pageService.importPagesFromJsonString", async ({ jsonString, requestUser }) => {
    let parsed;
    try {
        parsed = JSON.parse(jsonString);
    } catch {
        throw new error.badRequest("Invalid JSON");
    }

    const pagesArray = Array.isArray(parsed) ? parsed : parsed.pages;

    return await commands.execute("pageService.importPages", {
        pages: pagesArray,
        requestUser,
    });
}, {
    description: 'Import pages from a JSON string.',
    parameters: {
        jsonString: { type: 'string', description: 'JSON string containing a pages array or an object with a pages array' },
        requestUser: { type: 'object', description: 'Authenticated user performing the import' }
    }
});
