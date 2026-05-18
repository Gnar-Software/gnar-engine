import { commands, logger, error } from '@gnar-engine/core';
import { storedNotification } from '../services/storedNotification.service.js';
import { config } from '../config.js';
import { validateStoredNotification, validateStoredNotificationUpdate } from '../schema/storedNotification.schema.js';


/**
 * Get single stored-notification
 */
commands.register('notificationService.getSingleStoredNotification', async ({ id }) => {
    if (id) {
        return await storedNotification.getById({ id: id });
    } else {
        throw new error.badRequest('StoredNotification id required');
    }
});


/**
 * Get many stored-notifications
 */
commands.register('notificationService.getManyStoredNotifications', async ({ }) => {
    return await storedNotification.getAll();
});


/**
 * Get users stored-notifications
 */
commands.register('notificationService.getStoredNotificationsByUserId', async ({ userId }) => {
    if (!userId) {
        throw new error.badRequest('User ID required');
    }
    return await storedNotification.getByUserId({ userId });
});


/**
 * Create stored-notifications
 */
commands.register('notificationService.createStoredNotifications', async ({ storedNotifications }) => {
    const validationErrors = [];
    let createdNewStoredNotifications = [];

    for (const data of storedNotifications) {
        const { errors } = validateStoredNotification(data);
        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        const created = await storedNotification.create({ data });
        createdNewStoredNotifications.push(created);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid stored-notification data: ${validationErrors}`);
    }

    return createdNewStoredNotifications;
});


/**
 * Update stored-notification
 */
commands.register('notificationService.updateStoredNotification', async ({ id, data }) => {

    const validationErrors = [];

    if (!id) {
        throw new error.badRequest('StoredNotification ID required');
    }

    const obj = await storedNotification.getById({ id: id });

    if (!obj) {
        throw new error.notFound('StoredNotification not found');
    }

    delete data.id;

    const { errors } = validateStoredNotificationUpdate(data);

    if (errors?.length) {
        validationErrors.push(errors);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid stored-notification data: ${validationErrors}`);
    }

    return await storedNotification.update({
        id: id,
        data
    });
});


/**
 * Delete stored-notification
 */
commands.register('notificationService.deleteStoredNotification', async ({ id }) => {
    const obj = await storedNotification.getById({ id: id });
    if (!obj) {
        throw new error.notFound('StoredNotification not found');
    }
    return await storedNotification.delete({ id: id });
});