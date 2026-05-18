import { commands } from '@gnar-engine/core';
import { authorise } from '../policies/templates.policy.js';

/**
 * HTTP controller
 */
export const httpController = {

	/**
	 * Get single templates
	 */
	getSingle: {
		method: 'GET',
		url: '/templates/:id',
		preHandler: async (request, reply) => authorise.getSingle(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			const result = await commands.execute('getSingleTemplate', params);
			reply.code(200).send({ ...result });
		}
	},

	/**
	 * Get multiple templates
	 */
	getMany: {
		method: 'GET',
		url: '/templates/',
		preHandler: async (request, reply) => authorise.getMany(request, reply),
		handler: async (request, reply) => {
			const params = {
				pageSize: request.query?.pageSize,
				pageNum: request.query?.pageNum,
				filters: request.query?.filters ? JSON.parse(request.query?.filters) : {},
				ids: request.query?.ids ?? []
			};
			const results = await commands.execute('getManyTemplates', params);
			reply.code(200).send({ templates: results });
		}
	},

	/**
	 * Create new templates
	 */
	create: {
		method: 'POST',
		url: '/templates/',
		preHandler: async (request, reply) => authorise.create(request, reply),
		handler: async (request, reply) => {
			const params = {
				templatesArray: [request.body]
			};
			const results = await commands.execute('createTemplates', params);
			reply.code(200).send({ templates: results });
		},
	},

	/**
	 * Update templates
	 */
	update: {
		method: 'POST',
		url: '/templates/:id',
		preHandler: async (request, reply) => authorise.update(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id,
				data: request.body
			};
			const result = await commands.execute('updateTemplate', params);
			reply.code(200).send({ templates: result });
		},
	},

	/**
	 * Delete templates
	 */
	delete: {
		method: 'DELETE',
		url: '/templates/:id',
		preHandler: async (request, reply) => authorise.delete(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			await commands.execute('deleteTemplates', params);
			reply.code(200).send({ message: 'Templates deleted' });
		},
	},
}
