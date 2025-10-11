import { commands } from 'gnarengine-service-core';
import { authorise } from '../policies/user.policy.js';


/**
 * HTTP controller
 */
export const httpController = {

	/**
	 * Authenticate
	 */
	authenticate: {
		method: 'POST',
		url: '/authenticate/',
		handler: async (request, reply) => {
			// params from request
			const params = {
				username: request.body.username || null,
				password: request.body.password || null,
				email: request.body.email || null,
				apiKey: request.body.apiKey || null
			};

			// execute
			const token = await commands.execute('authenticate', params);

			if (!token) {
				return reply.code(401).send({ error: 'Authentication failed' });
			}

			// Get user data using token
			const user = await commands.execute('getAuthenticatedUser', { token });

			// handle response
			reply.code(200).send({
				token,
				user
			});
		}
	},

	/**
	 * Get single user
	 */
	getSingle: {
		method: 'GET',
		url: '/users/:id',
		preHandler: async (request, reply) => authorise.getSingle(request, reply),
		handler: async (request, reply) => {
			// params from request
			const params = {
				id: request.params.id
			};

			// execute
			const user = await commands.execute('getSingleUser', params);

			// handle response
			reply.code(200).send(
				{ user: user }
			);
		}
	},

	/**
	 * Get multiple users
	 */
	getMany: {
		method: 'GET',
		url: '/users/',
		preHandler: async (request, reply) => authorise.getMany(request, reply),
		handler: async (request, reply) => {
			// params from request
			const params = {};

			// execute
			const users = await commands.execute('getManyUsers', params);

			// handle response
			reply.code(200).send(
				{ users: users }
			);
		}
	},

	/**
	 * Create new user
	 */
	create: {
		method: 'POST',
		url: '/users/',
		preHandler: async (request, reply) => authorise.create(request, reply),
		handler: async (request, reply) => {
			// params from request
			const params = {
				users: [request.body.user]
			};

			// execute
			const users = await commands.execute('createUsers', params);

			// handle response
			reply.code(200).send(
				{ users: users }
			);
		},
	},

	/**
	 * Update user
	 */
	update: {
		method: 'POST',
		url: '/users/:id',
		preHandler: async (request, reply) => authorise.update(request, reply),
		handler: async (request, reply) => {
			// params from request
			const params = {
				id: request.params.id,
				newUserData: request.body
			};

			// execute
			const user = await commands.execute('updateUser', params);

			// handle response
			reply.code(200).send(
				{ user: user }
			);
		},
	},

	/**
	 * Delete user
	 */
	delete: {
		method: 'DELETE',
		url: '/users/:id',
		preHandler: async (request, reply) => authorise.delete(request, reply),
		handler: async (request, reply) => {
			// params from request
			const params = {
				id: request.params.id
			};

			// execute
			await commands.execute('deleteUser', params);

			// handle response
			reply.code(200).send(
				{ 'message': 'User deleted' }
			);
		},
	},
}