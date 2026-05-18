import { commands, logger, error } from '@gnar-engine/core';
import { notification } from '../services/notification.service.js';
import { config } from '../config.js';
import { validateNotification, validateNotificationUpdate } from '../schema/notification.schema.js';


/**
 * Get single notification
 */
commands.register('notificationService.getSingleNotification', async ({ id }) => {
    if (id) {
        return await notification.getById({ id: id });
    } else {
        throw new error.badRequest('Notification email or id required');
    }
});


/**
 * Get many notifications
 * Can be used to get all notifications by user id and by type using filters.
 */
commands.register('notificationService.getManyNotifications', async ({ pageSize, pageNum, filters, ids }) => {
    return await notification.getAll({ pageSize, pageNum, filters, ids });
});


/**
 * Create notifications
 */
commands.register('notificationService.createNotifications', async ({ notifications }) => {
    const validationErrors = [];
    let createdNewNotifications = [];

    for (const data of notifications) {
        // Split the data into notificationData and restData, validate notificationData
        const notificationData = {
            type: data.type,
            userId: data.userId,
            idempotencyKey: data.idempotencyKey ?? null,
        };

        const restData = { ...data };
        delete restData.type;
        delete restData.userId;
        delete restData.idempotencyKey;

        // validate and create the parent notification
        const { errors } = validateNotification(notificationData);

        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        // ensure idempotency
        const isIdempotent = await notification.checkIdempotent({
            idempotencyKey: data.idempotencyKey
        });

        if (!isIdempotent) {
            validationErrors.push(`Notification with idempotency key ${data.idempotencyKey} already exists`);
            continue;
        }

        const created = await notification.create({
            data: notificationData
        });

        // If there are additional data fields, create child notification records
        let childNotifications = [];

        if (Object.keys(restData).length > 0) {
            switch (data.type) {
                case 'email':
                    childNotifications = await commands.execute('notificationService.createEmailNotifications', {
                        emailNotifications: [{ ...restData, notificationId: created.id }]
                    });
                    break;
                case 'stored':
                    childNotifications = await commands.execute('notificationService.createStoredNotifications', {
                        storedNotifications: [{ ...restData, notificationId: created.id }]
                    });
                    break;
                default:
                    logger.error(`Unknown notification type '${data.type}' for notification ID ${created.id}`);
            }
        }

        // Merge parent and child notification data
        createdNewNotifications.push({ ...created, ...childNotifications });
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid notification data: ${validationErrors}`);
    }

    return createdNewNotifications;
});


/**
 * Update notification
 * @param {Object} params
 * @param {string} params.id - Notification ID
 * @param {Object} params.data - New notification data
 * @returns {Promise<Object>} The updated notification data
 */
commands.register('notificationService.updateNotification', async ({ id, data }) => {

    if (!id) {
        throw new error.badRequest('Notification ID required');
    }

    const existing = await notification.getById({ id });

    if (!existing) {
        throw new error.notFound('Notification not found');
    }

    // Split parent fields from child fields (only archived is allowed to be updated, you would not need to update the type or user)
    const notificationData = {};

    if (data.archived) {
        notificationData.archived = data.archived;
    }

    const { type: _, userId: __, archived: ____, ...restData } = data;

    const { errors } = validateNotificationUpdate(notificationData);

    if (errors?.length) {
        throw new error.badRequest(`Invalid notification data: ${errors}`);
    }

    const updated = await notification.update({ id, data: notificationData });

    let childNotification = {};

    // If there are child fields, update the relevant child record
    if (Object.keys(restData).length > 0) {
        switch (existing.type) {  // use existing.type — type shouldn't change on update
            case 'email':
                childNotification = await commands.execute('notificationService.updateEmailNotification', {
                    id: restData.id,
                    data: restData,
                });
                break;
            case 'stored':
                childNotification = await commands.execute('notificationService.updateStoredNotification', {
                    id: restData.id,
                    data: restData,
                });
                break;
            default:
                logger.error(`Unknown notification type '${existing.type}' for notification ID ${id}`);
        }
    }

    return { ...updated, ...childNotification };
});

/**
 * Archive multiple notifications by IDs
 */
commands.register('notificationService.archiveNotifications', async ({ ids }) => {

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new error.badRequest('Array of notification IDs required');
    }

    const archived = await notification.archive({ ids });
    return archived;
})

/**
 * Delete notification
 * @param {Object} params
 * @param {string|number} params.id - Notification ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
commands.register('notificationService.deleteNotification', async ({ id }) => {
    const obj = await notification.getById({ id: id });
    if (!obj) {
        throw new error.notFound('Notification not found');
    }
    return await notification.delete({ id: id });
});
