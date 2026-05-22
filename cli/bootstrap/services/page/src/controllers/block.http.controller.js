import { commands, logger } from '@gnar-engine/core';
import { authorise } from '../policies/block.policy.js';

/**
 * HTTP controller
 */
export const httpController = {

	/**
	 * Get single block
	 */
	getSingle: {
		method: 'GET',
		url: '/blocks/:id',
		preHandler: async (request, reply) => authorise.getSingle(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			const result = await commands.execute('getSingleBlock', params);
			reply.code(200).send({ block: result });
		}
	},

	/**
	 * Get multiple blocks
	 */
	getMany: {
		method: 'GET',
		url: '/blocks/',
		preHandler: async (request, reply) => authorise.getMany(request, reply),
		handler: async (request, reply) => {
			const params = {
				pageSize: request.query.pageSize,
				pageNum: request.query.pageNum,
			};
			const results = await commands.execute('getManyBlocks', params);
			reply.code(200).send({ blocks: results });
		}
	},

	/**
	 * Create new block
	 */
	create: {
		method: 'POST',
		url: '/blocks/',
		preHandler: async (request, reply) => authorise.create(request, reply),
		handler: async (request, reply) => {
			const params = {
				blocks: [request.body.block]
			};
			const results = await commands.execute('createBlocks', params);
			reply.code(200).send({ blocks: results });
		},
	},

	/**
	 * Update block
	 */
	update: {
		method: 'POST',
		url: '/blocks/:id',
		preHandler: async (request, reply) => authorise.update(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id,
				newBlockData: request.body.block
			};
			const result = await commands.execute('updateBlock', params);
			reply.code(200).send({ page: result });
		},
	},

	/**
	 * Delete block
	 */
	delete: {
		method: 'DELETE',
		url: '/blocks/:id',
		preHandler: async (request, reply) => authorise.delete(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			await commands.execute('deleteBlock', params);
			reply.code(200).send({ message: 'Block deleted' });
		},
	},

	exportBlocks: {
		method: "GET",
		url: "/blocks/export/blocks.json",
		preHandler: async (request, reply) => authorise.getMany(request, reply),
		handler: async (request, reply) => {
		const { fileName, jsonString } = await commands.execute("exportBlocksCollection", {});
		reply
			.header("Content-Type", "application/json; charset=utf-8")
			.header("Content-Disposition", `attachment; filename="${fileName}"`)
			.code(200)
			.send(jsonString);
		},
	},

	importBlocks: {
		method: "POST",
		url: "/blocks/import/blocks",
		preHandler: async (request, reply) => authorise.create(request, reply), // or getMany/update – whichever makes sense
		handler: async (request, reply) => {
		try {
			const jsonString = request.body?.jsonString;
			if (!jsonString) {
			return reply.code(400).send({ message: "Missing jsonString in request body" });
			}

			const result = await commands.execute("pageService.importBlocksFromJsonString", {
			jsonString,
			});

			return reply.code(200).send(result);
		} catch (err) {
			logger.error({ message: err?.message, stack: err?.stack }, "blocks import failed");
			return reply.code(500).send({ message: err?.message || "Import failed" });
		}
		},
	},
}
