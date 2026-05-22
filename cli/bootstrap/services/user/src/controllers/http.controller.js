import { commands } from '@gnar-engine/core';
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
			const params = {
				pageSize: request.query.pageSize,
				pageNum: request.query.pageNum,
				filters: request.query.filters ? JSON.parse(request.query.filters) : {},
				// filters can be passed as a JSON string in the query, e.g. ?filters={"role":"admin"}
				// this allows for flexible filtering based on any user fields
				// if no filters are provided, it will return all users with pagination
				// example filter: ?filters={"role":"admin","username":"john"}
			};

			// execute
			const users = await commands.execute('getManyUsers', params);

			// handle response
			reply.code(200).send(
				{ users: users }
			);
		}
	},

	/**
	 * Search users
	 */
	search: {
		method: 'GET',
		url: '/users/search',
		preaHandler: async (request, reply) => authorise.search(request, reply),
		handler: async (request, reply) => {
			// params from request
			const params = {
				term: request.query.term,
				pageSize: request.query.pageSize,
				pageNum: request.query.pageNum,
			};
			// execute
			const users = await commands.execute('searchUsers', params);

			// handle response
			reply.code(200).send({ users });
		}
	},

	/**
	 * Get user enums
	 */
	getUserEnums: {
		method: 'GET',
		url: '/users/enums',
		// preHandler: async (request, reply) => authorise.getUserEnums(request, reply),
		handler: async (request, reply) => {
			const enums = await commands.execute('getUserEnums');
			reply.code(200).send({ enums });
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
	 * Create new user with random password
	 */
	createWithRandomPassword: {
		method: 'POST',
		url: '/users/create-with-random-password/',
		preHandler: async (request, reply) => authorise.create(request, reply),
		handler: async (request, reply) => {
			// params from the request
			const params = {
				users: [request.body.user],
			};

			// execute
			const users = await commands.execute('createUserWithRandomPassword', params);

			// handle response
			reply.code(200).send(
				{ users: users }
			);
		}
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

    /**
     * Request password reset
     */
    requestPasswordReset: {
        method: 'POST',
        url: '/users/request-password-reset',
        handler: async (request, reply) => {
            const params = {
                email: request.body.email || null,
                createComplexPassword: !!request.body.createComplexPassword
            };

            await commands.execute('userService.requestPasswordReset', params);

            reply.code(200).send({ message: 'If that email exists, a reset link has been sent.' });
        }
    },

    /**
     * Change password
     */
    changePassword: {
        method: 'POST',
        url: '/users/change-password',
        handler: async (request, reply) => {
            const params = {
                email: request.body.email || null,
                token: request.body.token || null,
                password: request.body.password || null
            };

            await commands.execute('userService.changePassword', params);

            reply.code(200).send({ message: 'Password changed successfully' });
        }
    },
}
