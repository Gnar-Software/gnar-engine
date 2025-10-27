import { commands } from '@gnar-engine/core';
import { authorise } from '../policies/product.policy.js';

/**
 * HTTP controller
 */
export const httpController = {

	/**
	 * Get single product
	 */
	getSingle: {
		method: 'GET',
		url: '/products/:id',
		preHandler: async (request, reply) => authorise.getSingle(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			const result = await commands.execute('getSingleProduct', params);
			reply.code(200).send({ product: result });
		}
	},

	/**
	 * Get multiple products
	 */
	getMany: {
		method: 'GET',
		url: '/products/',
		preHandler: async (request, reply) => authorise.getMany(request, reply),
		handler: async (request, reply) => {
			const params = {};
			const results = await commands.execute('getManyProducts', params);
			reply.code(200).send({ products: results });
		}
	},

	/**
	 * Create new product
	 */
	create: {
		method: 'POST',
		url: '/products/',
		preHandler: async (request, reply) => authorise.create(request, reply),
		handler: async (request, reply) => {
			const params = {
				products: [request.body.product]
			};
			const results = await commands.execute('createProducts', params);
			reply.code(200).send({ products: results });
		},
	},

	/**
	 * Update product
	 */
	update: {
		method: 'POST',
		url: '/products/:id',
		preHandler: async (request, reply) => authorise.update(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id,
				newProductData: request.body
			};
			const result = await commands.execute('updateProduct', params);
			reply.code(200).send({ product: result });
		},
	},

	/**
	 * Delete product
	 */
	delete: {
		method: 'DELETE',
		url: '/products/:id',
		preHandler: async (request, reply) => authorise.delete(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			await commands.execute('deleteProduct', params);
			reply.code(200).send({ message: 'Product deleted' });
		},
	},
}
