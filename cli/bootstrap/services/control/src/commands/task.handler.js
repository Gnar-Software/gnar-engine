import { message, commands, logger } from '@gnar-engine/core';
import { task } from '../services/task.service.js';
import { validateTask } from '../schema/task.schema.js';


/**
 * Handle task batch
 *
 * @param {string} status - Task status
 */
commands.register('controlService.handleTaskBatch', async (status = null) => {

    if (!status) {
        status = 'scheduled';
    }

    let tasks = [];

    try {
        tasks = await task.getTaskBatch({
            status: status
        });
    } catch (error) {
        logger.error('Error getting task batch: ' + error);
    }

    if (tasks.length === 0) {
        return;
    }

    logger.info(`Processing tasks (status: ${status}): ${JSON.stringify(tasks)}`);

    const errors = [];

    const taskPromises = tasks.map(taskObj => (
        (async () => {
            let success = false;

            try {
                await commands.execute('controlService.handleTask', {
                    task: taskObj
                });
                await task.updateTaskStatus({ id: taskObj.id, status: 'completed' });

                success = true;
            } catch (error) {
                logger.error(error);
                errors.push({
                    task: taskObj,
                    error: error.message
                });
                await task.updateTaskStatus({ id: taskObj.id, status: 'failed' });
            }

            // reschedule failed tasks if required
            if (!success && taskObj.rescheduleCentrallyOnFailure) {
                try {
                    // increment idepmpotency key if it's present to avoid conflicts with the original task
                    taskObj.idempotencyKey = taskObj.idempotencyKey ? `${taskObj.idempotencyKey}-${Date.now()}` : '';

                    await commands.execute('controlService.centrallyRescheduleTask', {
                        task: taskObj
                    });
                } catch (error) {
                    logger.error(`Error rescheduling task ${taskObj.id}: ${error}`);
                    errors.push({
                        task: taskObj,
                        error: error.message
                    });
                }
            }
        })()
    ));

    await Promise.allSettled(taskPromises);

    if (errors.length > 0) {
        logger.info(JSON.stringify(errors));
        return errors;
    }
})

/**
 * Handle task
 *
 * @param {Object} taskObj
 * @returns {Promise<Object>} The task data
 */
commands.register('controlService.handleTask', async ({ task: taskObj }) => {
    try {
        logger.info(`Running Task: ${taskObj.name} - ${taskObj.id}`);

        // Add the task id to the payload
        taskObj.payload.taskId = taskObj.id;

        // Execute task
        try {
            const response = await commands.execute(taskObj.handler, taskObj.payload);

            // if there are errors (these are for runtime errors - should not be used for retrying)
            if (response.error || response.status === 'failed') {
                logger.error(`Error executing task ${taskObj.name}: ${response.error}. Failing task...`);
                throw new Error(`Error executing task ${taskObj.name}: ${response.error}`);
            }
        } catch (error) {
            throw new Error(error);
        }
    } catch (error) {
        throw new Error(`Error handling task: ${taskObj.name} - ${error}`);
    }
})

/**
 * Centrally reschedule task
 *
 * @param {Object} params
 * @param {Object} params.task The task data
 * @returns {Promise<Object>} The task data
 */
commands.register('controlService.centrallyRescheduleTask', async ({ task: taskObj }) => {
    try {
        let newScheduled;
        let oldScheduledDate = new Date(taskObj.scheduled);

        // reschedule for 5 seconds later
        newScheduled = new Date(Date.now() + 5 * 1000);

        // reschedule the task
        delete taskObj.id;
        delete taskObj.createdAt;
        delete taskObj.updatedAt;

        if (!taskObj.recurringInterval) {
            delete taskObj.recurringInterval;
        }

        if (taskObj.rescheduleCentrallyOnFailure) {
            taskObj.rescheduleCentrallyOnFailure = true;
        } else {
            delete taskObj.rescheduleCentrallyOnFailure;
        }

        taskObj.scheduled = newScheduled.toISOString().slice(0, 19).replace('T', ' ');
        taskObj.status = 'scheduled';

        logger.info('Rescheduling failed task', taskObj)

        await commands.execute('controlService.scheduleTask', {
            task: taskObj
        });

    } catch (error) {
        logger.error('Error rescheduling task centrally: ' + error);
        throw new Error(`Error rescheduling task: ${error}`);
    }
})

/**
 * Schedule task
 *
 * @param {Object} params
 * @param {Object} params.task The task data
 * @returns {Promise<Object>} The task data
 */
commands.register('controlService.scheduleTask', async ({ task: taskObj }) => {
    try {
        // prep task object
        taskObj.scheduled = new Date(taskObj.scheduled).toISOString().slice(0, 19).replace('T', ' ');
        taskObj.recurringTaskId = taskObj.recurringTaskId || null;

        logger.info('Scheduling task', taskObj);

        // validate the task
        const errors = validateTask(taskObj);

        if (errors) {
            throw new Error(JSON.stringify(errors));
        }

        // check indempotency
        if (taskObj.idempotencyKey) {
            const isIndempotent = await task.checkIndempotent({
                idempotencyKey: taskObj.idempotencyKey
            });

            if (!isIndempotent) {
                return {
                    status: 'already_scheduled',
                    message: 'Task with this idempotency key already exists'
                }
            }
        }

        // schedule the task
        const scheduledTask = await task.scheduleTask(taskObj);

        // return the task data
        return scheduledTask;
    } catch (error) {
        logger.error('Error scheduling task: ' + error);
        throw new Error(`Error scheduling task: ${error}`);
    }
})

/**
 * Get tasks by status
 *
 * @param {string} status - Task status
 */
commands.register('controlService.getTasksByStatus', async (status) => {
    try {
        if (!status) {
            status = 'scheduled';
        }

        const tasks = await task.getTasksByStatus({
            status: status
        });

        return tasks;
    } catch (error) {
        logger.error('Error getting tasks by status in handler: ' + error);
        throw new Error(`Error getting tasks by status in handler: ${error}`);
    }
})

/**
 * Delete failed tasks
 */
commands.register('controlService.deleteFailedTasks', async () => {
    try {
        const deleteFailedTasks = await task.deleteFailedTasks();
        logger.info('Deleted failed tasks: ' + deleteFailedTasks);
        return deleteFailedTasks;
    } catch (error) {
        logger.error('Error deleting failed tasks: ' + error);
        throw new Error(`Error deleting failed tasks: ${error}`);
    }
})

/**
 * Get scheduled tasks for recurring task
 *
 * @param {string} recurringTaskId - Recurring task
 * @return {Promise<Array>} The scheduled tasks for the recurring task
 */
commands.register('controlService.getScheduledTasksForRecurringTask', async ({ recurringTaskId }) => {
    try {
        if (!recurringTaskId) {
            throw new Error('Recurring task ID is required');
        }

        const tasks = await task.getScheduledForRecurringTask({ recurringTaskId });

        return tasks;
    } catch (error) {
        logger.error('Error getting scheduled tasks for recurring task in handler: ' + error);
        throw new Error(`Error getting scheduled tasks for recurring task in handler: ${error}`);
    }
});
