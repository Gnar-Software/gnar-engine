import { commands, error, logger } from '@gnar-engine/core';
import { templates } from '../services/templates.service.js';
import { validateTemplates, validateTemplatesUpdate } from '../schema/templates.schema.js';

import Handlebars from 'handlebars';


/**
 * Compile a Handlebars template with provided data
 */
commands.register('notificationService.compileTemplate', async ({ templateContent, data = {} }) => {
    // templates are stored in the database, with the content being the raw handlebars template string. 
    // We are passing the template content to this command, along with the data to be used in the template,
    // and this command will compile the template and return the result. 
    // This allows us to keep the template compilation logic in one place and reuse it across different 
    // types of notifications.

    const template = Handlebars.compile(templateContent);
    return template(data);
});


/**
 * Get single templates by ID
 */
commands.register('notificationService.getSingleTemplate', async ({ id }) => {
    if (id) {
        return await templates.getById({ id: id });
    } else {
        throw new error.badRequest('Templates id required');
    }
});


/**
 * Get templates by createdBy user ID
 */
commands.register('notificationService.getTemplatesByCreatedBy', async ({ createdBy }) => {
    if (!createdBy) {
        throw new error.badRequest('CreatedBy user ID required');
    }

    // Assuming a getByCreatedBy method exists in the templates service
    return await templates.getByCreatedBy({ createdBy: createdBy });
});


/**
 * Get templates by slug and optional version
 */
commands.register('notificationService.getTemplateBySlug', async ({ slug, version = null }) => {
    if (!slug) {
        throw new error.badRequest('Slug is required');
    }

    return await templates.getBySlug({ slug, version });
});


/**
 * Get many templates
 */
commands.register('notificationService.getManyTemplates', async ({ pageSize, pageNum, filters, ids }) => {
    return await templates.getAll({ pageSize, pageNum, filters, ids });
});


/**
 * Create templates
 */
commands.register('notificationService.createTemplates', async ({ templatesArray }) => {
    const validationErrors = [];
    let createdNewTemplates = [];

    for (const data of templatesArray) {
        const { errors } = validateTemplates(data);
        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        const created = await templates.create({ data });
        createdNewTemplates.push(created);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid templates data: ${validationErrors}`);
    }

    return createdNewTemplates;
});


/**
 * Update template
 */
commands.register('notificationService.updateTemplate', async ({ id, data }) => {

    const validationErrors = [];

    if (!id) {
        throw new error.badRequest('Template ID required');
    }

    const obj = await templates.getById({ id: id });

    if (!obj) {
        throw new error.notFound('Template not found');
    }

    delete data.id;

    const { errors } = validateTemplatesUpdate(data);

    if (errors?.length) {
        validationErrors.push(errors);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid template data: ${validationErrors}`);
    }

    return await templates.update({
        id: id,
        data
    });
});


/**
 * Delete template
 */
commands.register('notificationService.deleteTemplate', async ({ id }) => {
    const obj = await templates.getById({ id: id });
    if (!obj) {
        throw new error.notFound('Template not found');
    }
    return await templates.delete({ id: id });
});
