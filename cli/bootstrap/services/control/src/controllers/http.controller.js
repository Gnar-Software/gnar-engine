import { commands } from 'gnarengine-service-core';
import { authorise } from '../policies/task.policy.js';


/**
 * HTTP controller
 */
export const httpController = {

	/**
	 * Schedule a task
	 */
	tasksSchedule: {
		method: 'POST',
		url: '/tasks/schedule',
		preHandler: async (request, reply) => authorise.scheduleTaskByApi(request, reply),
		handler: async (request, reply) => {

			// params from request
			const params = {
				name: request.body.name,
				payload: request.body.payload
			};

			// execute
			const task = await commands.execute('scheduleTask', params);

			// handle response
			reply.code(200).send(
				{ task: task }
			);
		},
	},

	/**
	 * Execute task (not implemented)
	 */
	tasksExecute: {
		method: 'POST',
		url: '/tasks/execute',
		preHandler: async (request, reply) => authorise.executeTaskByApi(request, reply),
		handler: async (request, reply) => {

			// handle response
			reply.code(400).send(
				{ message: 'Not implemented' }
			);
		},
	},

	/**
	 * Execute task batch
	 */
	tasksExecuteBatch: {
		method: 'POST',
		url: '/tasks/execute-batch',
		preHandler: async (request, reply) => authorise.executeTaskByApi(request, reply),
		handler: async (request, reply) => {

			// execute
			const errors = await commands.execute('handleTaskBatch', request.body?.status);

			if (errors && errors.length > 0) {
				// handle response
				reply.code(200).send(
					{
						message: 'Task batch run but had errors',
						errors: errors
					}
				);
				return;
			}

			// handle response
			reply.code(200).send(
				{ message: 'Task batch run with no errors' }
			);
		},
	},

	/**
	 * Get tasks by status
	 */
	tasksGet: {
		method: 'GET',
		url: '/tasks/',
		preHandler: async (request, reply) => authorise.executeTaskByApi(request, reply),
		handler: async (request, reply) => {

			const status = request.query.status || 'scheduled';

			// execute
			const tasks = await commands.execute('getTasksByStatus', status);

			// handle response
			reply.code(200).send(
				{
					status: status,
					tasks: tasks
				}
			);
		},
	},

	/**
	 * Delete failed tasks
	 */
	tasksDeleteFailed: {
		method: 'POST',
		url: '/tasks/delete-failed',
		preHandler: async (request, reply) => authorise.executeTaskByApi(request, reply),
		handler: async (request, reply) => {

			// execute
			const numDeletedTasks = await commands.execute('deleteFailedTasks');

			// handle response
			reply.code(200).send(
				{
					message: 'Failed tasks deleted',
					numDeletedTasks: numDeletedTasks
				}
			);
		},
	},

	/**
	 * Migrations
	 */
	runMigrations: {
		method: 'POST',
		url: '/control/migrations',
		preHandler: async (request, reply) => authorise.runMigrationsByApi(request, reply),
		handler: async (request, reply) => {

			const params = {
				service: request.body.service || null,
				migration: request.body.migration || null
			};

			// execute
			await commands.execute('runMigrations', params);

			// handle response
			reply.code(200).send(
				{ message: 'Migrations triggered' }
			);
		},
	},

	/**
	 * Seeders
	 */
	runSeeders: {
		method: 'POST',
		url: '/control/seeders',
		preHandler: async (request, reply) => authorise.runSeedersByApi(request, reply),
		handler: async (request, reply) => {

			const params = {
				service: request.body.service || null
			};

			// execute
			await commands.execute('runSeeders', params);

			// handle response
			reply.code(200).send(
				{ message: 'Seeders triggered' }
			);
		}
	},

	/**
	 * Reset
	 */
	reset: {
		method: 'POST',
		url: '/control/reset',
		preHandler: async (request, reply) => authorise.runResetByApi(request, reply),
		handler: async (request, reply) => {

			const params = {
				service: request.body.service || null
			};

			// execute
			await commands.execute('runReset', params);

			// handle response
			reply.code(200).send(
				{ message: 'Reset triggered' }
			);
		}
	},

	/**
	 * Health check
	 */
	healthCheck: {
		method: 'GET',
		url: '/control/health',
		handler: async (request, reply) => {

			// execute
			await commands.execute('runHealthcheck');

			// handle response
			reply.code(200).send(
				{ message: 'health check passed!' }
			);
		}
	},

	/**
	 * ECS health check
	 */
	ecsHealthCheck: {
		method: 'GET',
		url: '/control/',
		handler: async (request, reply) => {
			reply.code(200).send(
				{ message: 'Server is up' }
			);
		}
	},

};