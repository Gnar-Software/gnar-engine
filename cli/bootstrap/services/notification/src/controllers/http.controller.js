import { commands } from '@gnar-engine/core';
import { authorise } from '../policies/notification.policy.js';

/**
 * HTTP controller
 */
export const httpController = {

	/**
	 * Get single notification
	 */
	getSingle: {
		method: 'GET',
		url: '/notifications/:id',
		preHandler: async (request, reply) => authorise.getSingle(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			const result = await commands.execute('getSingleNotification', params);
			reply.code(200).send({ notification: result });
		}
	},

	/**
	 * Get multiple notifications
	 */
	getMany: {
		method: 'GET',
		url: '/notifications/',
		preHandler: async (request, reply) => authorise.getMany(request, reply),
		handler: async (request, reply) => {
			const params = {};
			const results = await commands.execute('getManyNotifications', params);
			reply.code(200).send({ notifications: results });
		}
	},

	/**
	 * Create new notification
	 */
	create: {
		method: 'POST',
		url: '/notifications/',
		preHandler: async (request, reply) => authorise.create(request, reply),
		handler: async (request, reply) => {
			const params = {
				notifications: [request.body.notification]
			};
			const results = await commands.execute('createNotifications', params);
			reply.code(200).send({ notifications: results });
		},
	},

	/**
	 * Update notification
	 */
	update: {
		method: 'POST',
		url: '/notifications/:id',
		preHandler: async (request, reply) => authorise.update(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id,
				data: request.body
			};
			const result = await commands.execute('updateNotification', params);
			reply.code(200).send({ notification: result });
		},
	},

	/**
	 * Delete notification
	 */
	delete: {
		method: 'DELETE',
		url: '/notifications/:id',
		preHandler: async (request, reply) => authorise.delete(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			await commands.execute('deleteNotification', params);
			reply.code(200).send({ message: 'Notification deleted' });
		},
	},
}
