import { commands } from '@gnar-engine/core';
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

			const params = {
				status: request.query.status || 'scheduled',
				orderDirection: request.query.orderDirection || 'ASC'
			};

			// execute
			const tasks = await commands.execute('getTasksByStatus', params);

			// handle response
			reply.code(200).send(
				{
					status: params.status,
					tasks: tasks
				}
			);
		},
	},

	/**
	 * Get recurring tasks
	 */
	recurringTasksGet: {
		method: 'GET',
		url: '/tasks/recurring',
		preHandler: async (request, reply) => authorise.executeTaskByApi(request, reply),
		handler: async (request, reply) => {

			// params from request
			const params = {
				pageNum: request.query.pageNum,
				pageSize: request.query.pageSize,
				filters: request.query.filters ? JSON.parse(request.query.filters) : {},
				orderBy: request.query.orderBy ? JSON.parse(request.query.orderBy) : { key: 'nextRunAt', direction: 'ASC' }
			};

			// execute
			const recurringTasks = await commands.execute('getManyRecurringTasks', params);

			// handle response
			reply.code(200).send(
				{ recurringTasks: recurringTasks }
			);
		},
	},

	/**
	 * Delete recurring task
	 */
	recurringTasksDelete: {
		method: 'DELETE',
		url: '/tasks/recurring/:id',
		preHandler: async (request, reply) => authorise.delete(request, reply),
		handler: async (request, reply) => {

			// params from request
			const params = {
				id: request.params.id
			};

			// execute
			await commands.execute('deleteRecurringTask', params);

			// handle response
			reply.code(200).send(
				{ message: 'Recurring task deleted' }
			);
		},
	},

	/**
	 * Delete task
	 */
	tasksDelete: {
		method: 'DELETE',
		url: '/tasks/:id',
		preHandler: async (request, reply) => authorise.delete(request, reply),
		handler: async (request, reply) => {

			// params from request
			const params = {
				id: request.params.id
			};

			// execute
			await commands.execute('deleteTask', params);

			// handle response
			reply.code(200).send(
				{ message: 'Task deleted' }
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
