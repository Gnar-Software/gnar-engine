import { logger, utils, db } from '@gnar-engine/core';


/**
 * Task Service
 */
export const task = {

    // schedule a task
    scheduleTask: async ({name, payload, scheduled, recurringInterval, recurringIntervalCount, rescheduleCentrallyOnSuccess = false, rescheduleCentrallyOnFailure = false, handlerServiceName, handlerName, idempotencyKey = ''}) => {
        try {
            const [result] = await db.execute(
                'INSERT INTO `tasks` (`id`, `name`, `payload`, `status`, `scheduled`, `recurring_interval`, `recurring_interval_count`, `reschedule_centrally_on_success`, `reschedule_centrally_on_failure`, `handler_service_name`, `handler_name`, `idempotency_key`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [utils.uuid(), name, JSON.stringify(payload), 'scheduled', scheduled, recurringInterval, recurringIntervalCount, rescheduleCentrallyOnSuccess, rescheduleCentrallyOnFailure, handlerServiceName, handlerName, idempotencyKey]
            );

            return result.insertId;
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
            const [result] = await db.execute(
                'SELECT * FROM `tasks` WHERE `status` = ? AND `scheduled` <= NOW()',
                [status]
            );

            // map from snake case to camel case
            const tasks = result.map(task => {
                return {
                    id: task.id,
                    name: task.name,
                    payload: JSON.parse(task.payload),
                    status: task.status,
                    scheduled: task.scheduled,
                    recurringInterval: task.recurring_interval,
                    recurringIntervalCount: task.recurring_interval_count,
                    rescheduleCentrallyOnSuccess: task.reschedule_centrally_on_success,
                    rescheduleCentrallyOnFailure: task.reschedule_centrally_on_failure,
                    handlerServiceName: task.handler_service_name,
                    handlerName: task.handler_name,
                    idempotencyKey: task.idempotency_key
                };
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

            // map from snake case to camel case
            const tasks = result.map(task => {
                return {
                    id: task.id,
                    name: task.name,
                    payload: JSON.parse(task.payload),
                    status: task.status,
                    scheduled: task.scheduled,
                    recurringInterval: task.recurring_interval,
                    recurringIntervalCount: task.recurring_interval_count,
                    rescheduleCentrallyOnSuccess: task.reschedule_centrally_on_success,
                    rescheduleCentrallyOnFailure: task.reschedule_centrally_on_failure,
                    handlerServiceName: task.handler_service_name,
                    handlerName: task.handler_name,
                    idempotencyKey: task.idempotency_key
                };
            });

            return tasks;
        } catch (error) {
            logger.error("Error getting tasks by status in service:" + error);
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
    }
};
