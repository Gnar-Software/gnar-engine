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
		url: '/mcp/',
		preHandler: async (request, reply) => authorise.canUseMcp(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			const result = await commands.execute('getSingleMcp', params);
			reply.code(200).send({ mcp: result });
		}
	}
}
