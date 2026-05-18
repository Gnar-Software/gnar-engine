import { logger, utils, db } from '@gnar-engine/core';
import { config } from '../config.js';


/**
 * Task Service
 */
export const task = {

    // get task by id
    getById: async ({id}) => {
        const [result] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);

        if (!result) {
            return null;
        }

        const normalisedResult = db.sql.helpers.objectToCamelCase(result[0]);

        try {
            normalisedResult.payload = JSON.parse(normalisedResult.payload)
        } catch (error) {

        }

        return normalisedResult;
    },

    // schedule a task
    scheduleTask: async ({
        name,
        payload,
        scheduled,
        recurringTaskId,
        rescheduleCentrallyOnFailure = true,
        handler,
        idempotencyKey = ''
    }) => {
        try {
            const id = utils.uuid();

            const [result] = await db.execute(
                'INSERT INTO `tasks` (`id`, `name`, `payload`, `status`, `scheduled`, `recurring_task_id`, `reschedule_centrally_on_failure`, `handler`, `idempotency_key`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, name, JSON.stringify(payload), 'scheduled', scheduled, recurringTaskId, rescheduleCentrallyOnFailure, handler, idempotencyKey]
            );

            return await task.getById({
                id: id
            });
        } catch (error) {
            logger.error("Error scheduling task:" + error);
            throw error;
        }
    },

    // update task status
    updateTaskStatus: async ({id, status}) => {
        try {
            const [result] = await db.execute(
                'UPDATE `tasks` SET `status` = ? WHERE `id` = ?',
                [status, id]
            );

            return result.affectedRows;
        } catch (error) {
            logger.error("Error updating task status:" + error);
            throw error;
        }
    },

    // cancel tasks by associated resource id
    cancelTasksByAssociatedResourceId: async ({associatedResourceId}) => {
        try {
            const [result] = await db.execute(
                'UPDATE `tasks` SET `status` = ? WHERE `associated_resource_id` = ?',
                ['cancelled', associatedResourceId]
            );

            return result.affectedRows;
        } catch (error) {
            logger.error("Error cancelling tasks by associated resource id:" + error);
            throw error;
        }
    },

    // get task batch
    getTaskBatch: async ({status}) => {
        try {
            const claimedStatus = 'processing-' + config.hostName;

            // claim
            await db.execute(
                'UPDATE `tasks` SET `status` = ? WHERE `status` = ? AND `scheduled` <= NOW()',
                [claimedStatus, status]
            );

            // fetch
            const [result] = await db.execute(
                'SELECT * FROM `tasks` WHERE `status` = ? AND `scheduled` <= NOW()',
                [claimedStatus]
            );

            // normalise
            let tasks = result.map(taskObj => {
                return task.normaliseTaskForResponse(taskObj);
            });

            return tasks;
        } catch (error) {
            logger.error("Error getting task batch:" + error);
            throw error;
        }
    },

    // get tasks by status
    getTasksByStatus: async ({status}) => {
        try {
            const [result] = await db.execute(
                'SELECT * FROM `tasks` WHERE `status` = ?',
                [status]
            );

            // normalise
            let tasks = result.map(taskObj => {
                return task.normaliseTaskForResponse(taskObj);
            });

            return tasks;
        } catch (error) {
            logger.error("Error getting tasks by status in service:" + error);
            throw error;
        }
    },

    // get scheduled tasks by recurring task if task is active
    getScheduledForRecurringTask: async ({ recurringTaskId }) => {
        try {
            const [result] = await db.execute(
                'SELECT * FROM `tasks` WHERE `recurring_task_id` = ? AND `status` = ? AND `scheduled` >= NOW() ORDER BY `scheduled` ASC',
                [recurringTaskId, 'scheduled']
            );

            // normalise
            let tasks = result.map(taskObj => {
                return task.normaliseTaskForResponse(taskObj);
            });

            return tasks;
        } catch (error) {
            logger.error("Error getting scheduled tasks for recurring task in service:" + error);
            throw error;
        }
    },

    // ensure task is the only scheduled with this indempotency key
    checkIndempotent: async ({idempotencyKey}) => {
        try {
            if (!idempotencyKey) {
                return true;
            }

            const [result] = await db.execute(
                'SELECT * FROM `tasks` WHERE `idempotency_key` = ? AND `status` = ?',
                [idempotencyKey, 'scheduled']
            );

            return result.length === 0;
        } catch (error) {
            logger.error("Error checking indempotency:" + error);
            throw error;
        }
    },

    // delete failed tasks
    deleteFailedTasks: async () => {
        try {
            const [result] = await db.execute(
                'DELETE FROM `tasks` WHERE `status` = ?',
                ['failed']
            );

            return result.affectedRows;
        } catch (error) {
            logger.error("Error deleting failed tasks:" + error);
            throw error;
        }
    },

    normaliseTaskForResponse: (task) => {
        const normalisedTask = db.sql.helpers.objectToCamelCase(task);

        try {
            if (typeof task.payload === 'string') {
                normalisedTask.payload = JSON.parse(task.payload);
            }
        } catch (error) {

        }

        return normalisedTask;
    }
};
