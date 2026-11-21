import { commands } from '@gnar-engine/core';
import { authorise } from '../policies/mcp.policy.js';

/**
 * HTTP controller
 */
export const httpController = {

	/**
	 * Get single mcp
	 */
	getSingle: {
		method: 'GET',
		url: '/mcps/:id',
		preHandler: async (request, reply) => authorise.getSingle(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			const result = await commands.execute('getSingleMcp', params);
			reply.code(200).send({ mcp: result });
		}
	},

	/**
	 * Get multiple mcps
	 */
	getMany: {
		method: 'GET',
		url: '/mcps/',
		preHandler: async (request, reply) => authorise.getMany(request, reply),
		handler: async (request, reply) => {
			const params = {};
			const results = await commands.execute('getManyMcps', params);
			reply.code(200).send({ mcps: results });
		}
	},

	/**
	 * Create new mcp
	 */
	create: {
		method: 'POST',
		url: '/mcps/',
		preHandler: async (request, reply) => authorise.create(request, reply),
		handler: async (request, reply) => {
			const params = {
				mcps: [request.body.mcp]
			};
			const results = await commands.execute('createMcps', params);
			reply.code(200).send({ mcps: results });
		},
	},

	/**
	 * Update mcp
	 */
	update: {
		method: 'POST',
		url: '/mcps/:id',
		preHandler: async (request, reply) => authorise.update(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id,
				newMcpData: request.body
			};
			const result = await commands.execute('updateMcp', params);
			reply.code(200).send({ mcp: result });
		},
	},

	/**
	 * Delete mcp
	 */
	delete: {
		method: 'DELETE',
		url: '/mcps/:id',
		preHandler: async (request, reply) => authorise.delete(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			await commands.execute('deleteMcp', params);
			reply.code(200).send({ message: 'Mcp deleted' });
		},
	},
}
