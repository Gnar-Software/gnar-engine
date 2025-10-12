import { message, commands, logger } from '@gnar-engine/core';
import { task } from '../services/task.service.js';
import { validateTask } from '../schema/control.schema.js';


/**
 * Handle task batch
 * 
 * @param {string} status - Task status
 */
commands.register('controlService.handleTaskBatch', async (status = null) => {
    
    if (!status) {
        status = 'scheduled';
    }

    logger.info(`Running Task batch... Status: ${status}`);

    const tasks = await task.getTaskBatch({
        status: status
    });

    logger.info('Found tasks: ' + JSON.stringify(tasks));

    const errors = [];

    const taskPromises = tasks.map(taskObj => (
        (async () => {
            let success = false;

            try {
                logger.info(taskObj);
                await handleTask(taskObj);
                await task.updateTaskStatus({ id: taskObj.id, status: 'completed' });

                success = true;
            } catch (error) {
                logger.error(`Error handling task ${taskObj.id}: ${error}`);
                errors.push({
                    task: taskObj,
                    error: error.message
                });
                await task.updateTaskStatus({ id: taskObj.id, status: 'failed' });
            }

            try {
                if (success) {
                    if (taskObj.rescheduleCentrallyOnSuccess) {
                        await centrallyRescheduleTask({ task: taskObj });
                    }
                } else {
                    if (taskObj.rescheduleCentrallyOnFailure) {
                        await centrallyRescheduleTask({ task: taskObj });
                    }
                }
            } catch (error) {
                logger.error(`Error rescheduling task ${taskObj.id}: ${error}`);
                errors.push({
                    task: taskObj,
                    error: error.message
                });
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
commands.register('controlService.handleTask', async (taskObj) => {
    try {
        logger.info(`Running Task: ${taskObj.name} - ${taskObj.id}`);

        // Add the task id to the payload
        taskObj.payload.taskId = taskObj.id;

        // Execute task 
        try {
            const response = await message.sendAwaitResponse(taskObj.handlerServiceName, {
                method: taskObj.handlerName,
                data: taskObj.payload
            });

            // if there are errors (these are for runtime errors - should not be used for retrying)
            if (response.error || response.status === 'failed') {
                logger.error(`Error executing task ${taskObj.name}: ${response.error}. Failing task...`);
                throw new Error(`Error executing task ${taskObj.name}: ${response.error}`);
            }
        } catch (error) {
            throw new Error(error);
        }
    } catch (error) {
        await task.updateTaskStatus({id: taskObj.id, status: 'failed'});
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
commands.register('controlService.centrallyRescheduleTask', async ({task: taskObj}) => {
    try {
        let newScheduled;
        let oldScheduledDate = new Date(taskObj.scheduled);

        switch (taskObj.recurringInterval) {
            case 'hourly':
                newScheduled = new Date(oldScheduledDate.getTime() + taskObj.recurringIntervalCount * 60 * 60 * 1000);
                break;
            case 'daily':
                newScheduled = new Date(oldScheduledDate.getTime() + taskObj.recurringIntervalCount * 24 * 60 * 60 * 1000);
                break;
            case 'weekly':
                newScheduled = new Date(oldScheduledDate.getTime() + taskObj.recurringIntervalCount * 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly': {
                let scheduledDate = new Date(oldScheduledDate);
                scheduledDate.setMonth(scheduledDate.getMonth() + taskObj.recurringIntervalCount);
                newScheduled = scheduledDate;
                break;
            }
            case 'yearly': {
                let scheduledDate = new Date(oldScheduledDate);
                scheduledDate.setFullYear(scheduledDate.getFullYear() + taskObj.recurringIntervalCount);
                newScheduled = scheduledDate;
                break;
            }

            default:
                throw new Error('Invalid scheduling interval: ' + taskObj.recurringInterval);
        }

        // reschedule the task
        delete taskObj.id;

        await scheduleTask({
            task: {
                ...taskObj,
                scheduled: newScheduled,
                status: 'scheduled'
            }
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
commands.register('controlService.scheduleTask', async ({task: taskObj}) => {
    try {
        // prep task object
        taskObj.scheduled = new Date(taskObj.scheduled).toISOString().slice(0, 19).replace('T', ' ');
        taskObj.rescheduleCentrallyOnSuccess = !!taskObj.rescheduleCentrallyOnSuccess;
        taskObj.rescheduleCentrallyOnFailure = !!taskObj.rescheduleCentrallyOnFailure;
        taskObj.recurringIntervalCount = taskObj.recurringIntervalCount || 1;
        
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
                throw new Error('Task task is already scheduled: ' + taskObj.idempotencyKey);
            }
        }

        // schedule the task
        const taskId = await task.scheduleTask(taskObj);

        logger.info('Scheduled task: ' + JSON.stringify(taskObj));

        // return the task data
        return {
            id: taskId,
            ...taskObj
        }
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
