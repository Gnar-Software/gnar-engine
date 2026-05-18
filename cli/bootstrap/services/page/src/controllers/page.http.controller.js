import { commands, logger } from '@gnar-engine/core';
import { authorise } from '../policies/page.policy.js';

/**
 * HTTP controller
 */
export const httpController = {

	/**
	 * Get single page
	 */
	getSingle: {
		method: 'GET',
		url: '/pages/:id',
		preHandler: async (request, reply) => authorise.getSingle(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			const result = await commands.execute('getSinglePage', params);
			reply.code(200).send({ page: result });
		}
	},

	/**
	 * Get multiple pages
	 */
	getMany: {
		method: 'GET',
		url: '/pages/',
		preHandler: async (request, reply) => authorise.getMany(request, reply),
		handler: async (request, reply) => {
			const params = {
				pageSize: request.query.pageSize,
				pageNum: request.query.pageNum
			};
			const results = await commands.execute('getManyPages', params);
			reply.code(200).send({ pages: results });
		}
	},

	/**
	 * Create new page
	 */
	create: {
		method: 'POST',
		url: '/pages/',
		preHandler: async (request, reply) => authorise.create(request, reply),
		handler: async (request, reply) => {
			const params = {
				pages: [request.body.page],
                requestUser: request.user
			};
			const results = await commands.execute('createPages', params);
			reply.code(200).send({ pages: results });
		},
	},

	/**
	 * Update page
	 */
	update: {
		method: 'POST',
		url: '/pages/:id',
		preHandler: async (request, reply) => authorise.update(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id,
				newPageData: request.body.page,
                requestUser: request.user
			};
			const result = await commands.execute('updatePage', params);
			reply.code(200).send({ page: result });
		},
	},

	/**
	 * Delete page
	 */
	delete: {
		method: 'DELETE',
		url: '/pages/:id',
		preHandler: async (request, reply) => authorise.delete(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			await commands.execute('deletePage', params);
			reply.code(200).send({ message: 'Page deleted' });
		},
	},

    exportPages: {
        method: 'GET',
        url: '/pages/export/pages.json',
        preHandler: async (request, reply) => authorise.getMany(request, reply),
        handler: async (request, reply) => {
            const { fileName, jsonString } = await commands.execute('exportPages', {});
            reply
                .header('Content-Type', 'application/json; charset=utf-8')
                .header('Content-Disposition', `attachment; filename="${fileName}"`)
                .code(200)
                .send(jsonString);
        },
    },

    exportBlocks: {
        method: 'GET',
        url: '/pages/export/blocks.json',
        preHandler: async (request, reply) => authorise.getMany(request, reply),
        handler: async (request, reply) => {
            const { fileName, jsonString } = await commands.execute('exportBlocks', {});
            reply
                .header('Content-Type', 'application/json; charset=utf-8')
                .header('Content-Disposition', `attachment; filename="${fileName}"`)
                .code(200)
                .send(jsonString);
        },
    },

    importPages: {
        method: 'POST',
        url: '/pages/import/pages',
        handler: async (request, reply) => {
            try {
                const jsonString = request.body?.jsonString;
                if (!jsonString) {
                    return reply.code(400).send({ message: 'Missing jsonString in request body' });
                }

                const result = await commands.execute('pageService.importPagesFromJsonString', {
                    jsonString,
                    requestUser: request.user,
                });

                return reply.code(200).send(result);
            } catch (err) {
                logger.error({ message: err?.message, stack: err?.stack }, 'import failed');
                return reply.code(500).send({ message: err?.message || 'Import failed' });
            }
        },
    },
};
