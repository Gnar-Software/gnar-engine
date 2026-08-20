import { commands, logger, error, utils } from '@gnar-engine/core';
import { recurringTask } from '../services/recurringtask.service.js';
import { config } from '../config.js';
import { validateRecurringTask } from '../schema/recurringtask.schema.js';
import { task } from '../services/task.service.js';


/**
 * Get single recurring task
 */
commands.register('controlService.getSingleRecurringTask', async ({ id, idempotencyKey }) => {
    if (id) {
        return await recurringTask.getById({ id: id });
    } else if (idempotencyKey) {
        return await recurringTask.getByIdempotencyKey({ idempotencyKey: idempotencyKey });
    } else {
        throw new error.badRequest('RecurringTask id required');
    }
});

/**
 * Get many recurring tasks
 */
commands.register('controlService.getManyRecurringTasks', async ({ pageSize, pageNum, filters, orderBy }) => {
    return await recurringTask.getAll({ pageSize, pageNum, filters, orderBy });
});

/**
 * Create recurring tasks
 *
 * @param {Array} recurringTasks - Array of recurring task objects to create
 * @param {boolean} update - If true, will update existing recurring tasks with matching idempotency keys instead of skipping them
 * @returns {Array} - Array of created or updated recurring task objects
 */
commands.register('controlService.createRecurringTasks', async ({ recurringTasks, update = false }) => {
    const validationErrors = [];
    let createdNewRecurringTasks = [];

    for (const newData of recurringTasks) {
        const { errors } = validateRecurringTask(newData);
        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        // ensure update is provided with idempotency key
        if (update && !newData.idempotencyKey) {
            validationErrors.push('Update operations require an idempotency key');
            continue;
        }

        // set nextRunAt
        newData.nextRunAt = newData.startsAt;

        // check for duplicates based on idempotency key if it's provided
        if (newData.idempotencyKey) {
            const existing = await commands.execute('controlService.getSingleRecurringTask', {
                idempotencyKey: newData.idempotencyKey
            });

            if (existing) {
                if (update) {
                    logger.info('updating recurring task', existing);
                    const updated = await recurringTask.update({
                        id: existing.id,
                        updatedData: newData
                    });
                    createdNewRecurringTasks.push(updated);
                } else {
                    logger.info('Recurring task with idempotency key already exists, skipping creation:', newData.idempotencyKey);
                    createdNewRecurringTasks.push(existing);
                }

                continue;
            }
        }

        const created = await recurringTask.create(newData);
        createdNewRecurringTasks.push(created);
    }

    if (validationErrors.length) {
        logger.error('Validation errors creating recurring tasks:', validationErrors);
        throw new error.badRequest(`Invalid recurring task data: ${validationErrors}`);
    }

    return createdNewRecurringTasks;
});

/**
 * Update recurring task
 */
commands.register('controlService.updateRecurringTask', async ({id, newRecurringTaskData}) => {

    const validationErrors = [];

    if (!id) {
        throw new error.badRequest('Recurring task ID required');
    }

    const obj = await recurringTask.getById({id: id});

    if (!obj) {
        throw new error.notFound('Recurring task not found');
    }

    delete newRecurringTaskData.id;

    const { errors } = validateRecurringTaskUpdate(newRecurringTaskData);

    if (errors?.length) {
        validationErrors.push(errors);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid recurringTask data: ${validationErrors}`);
    }

    return await recurringTask.update({
        id: id,
        updatedData: newRecurringTaskData
    });
});

/**
 * Delete recurring task
 */
commands.register('controlService.deleteRecurringTask', async ({ id }) => {
    const obj = await recurringTask.getById({id: id});
    if (!obj) {
        throw new error.notFound('Recurring task not found');
    }
    return await recurringTask.delete({id: id});
});

/**
 * Schedule tasks from recurring tasks
 */
commands.register('controlService.scheduleFromRecurringTasks', async () => {
    const now = new Date();

    // get all recurring tasks that nextRun is in the past
    const recurringTasksToSchedule = await recurringTask.getAll({
        filters: {
            status: 'active',
            nextRunAt: { operator: 'lte', value: now }
        },
        pageSize: 9999,
        pageNum: 1
    });

    const schedulingErrors = [];

    // for each, schedule a task and update the recurring task's nextRun
    for (const recurringTaskObj of recurringTasksToSchedule.data) {

        try {
            // get already scheduled future tasks
            const existingTasks = await task.getScheduledForRecurringTask({
                recurringTaskId: recurringTaskObj.id
            });

            const existingCount = existingTasks.length;

            // calculate how many more we need to schedule
            const numTasksToCreate = config.tasks.forwardScheduleNum - existingCount;

            if (numTasksToCreate <= 0) continue;

            // Calculate the forward-booking cursor without changing previously scheduled due tasks.
            let cursorDate = new Date(Math.max(new Date(recurringTaskObj.nextRunAt).getTime(), now.getTime()));

            if (existingCount > 0) {
                // Continue after the latest existing future task so we only top up the forward window.
                const lastTask = existingTasks[existingCount - 1];
                cursorDate = new Date(lastTask.scheduled);
            }

            const interval = utils.cronExpressionParser.parse(recurringTaskObj.cronExpression, {
                currentDate: cursorDate
            });

            // create tasks until we've created enough or reached the end of the schedule
            let created = 0;

            while (created < numTasksToCreate) {

                const nextDate = interval.next().toDate();

                // ensure we don't surpass endsAt
                if (recurringTaskObj.endsAt && new Date(nextDate) > new Date(recurringTaskObj.endsAt)) {
                    break;
                }

                let idempotencyKey;

                if (recurringTaskObj.idempotencyKey) {
                    idempotencyKey = `${recurringTaskObj.idempotencyKey}-${nextDate.getTime()}`;
                } else {
                    idempotencyKey = recurringTaskObj.id + '-' + nextDate.getTime();
                }

                const taskObj = {
                    name: recurringTaskObj.name,
                    payload: recurringTaskObj.payload,
                    handler: recurringTaskObj.handler,
                    scheduled: nextDate,
                    recurringTaskId: recurringTaskObj.id,
                    rescheduleCentrallyOnFailure: recurringTaskObj.rescheduleCentrallyOnFailure ? true : false,
                    idempotencyKey: idempotencyKey
                };

                await commands.execute('controlService.scheduleTask', {
                    task: taskObj
                });

                created++;
            }

            // update nextRunAt cursor to the first scheduled event scheduled at
            const nextInterval = utils.cronExpressionParser.parse(recurringTaskObj.cronExpression, {
                currentDate: cursorDate
            });

            const nextCursor = nextInterval.next().toDate();

            if (!recurringTaskObj.endsAt || nextCursor <= new Date(recurringTaskObj.endsAt)) {
                await recurringTask.update({
                    id: recurringTaskObj.id,
                    updatedData: {
                        nextRunAt: new Date(nextCursor).toISOString().slice(0, 19).replace('T', ' ')
                    }
                });
            }

        } catch (error) {
            logger.error(`Failed to create task from recurring task ${recurringTaskObj.id}: ${error.message}`);

            schedulingErrors.push({
                recurringTaskId: recurringTaskObj.id,
                error: error.message
            });
        }
    }

    if (schedulingErrors.length) {
        logger.error('Errors scheduling tasks from recurring tasks:', schedulingErrors);

        return false;
    }

    return true;
});
