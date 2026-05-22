import { commands, error } from '@gnar-engine/core';
import { storedNotification } from '../services/storedNotification.service.js';
import { validateStoredNotification, validateStoredNotificationUpdate } from '../schema/storedNotification.schema.js';

commands.register('notificationService.getSingleStoredNotification', async ({ id }) => {
    if (!id) {
        throw new error.badRequest('StoredNotification id required');
    }

    return await storedNotification.getById({ id });
});

commands.register('notificationService.getManyStoredNotifications', async ({ pageSize, pageNum } = {}) => {
    return await storedNotification.getAll({ pageSize, pageNum });
});

commands.register('notificationService.getStoredNotificationsByUserId', async ({ userId, pageSize, pageNum }) => {
    if (!userId) {
        throw new error.badRequest('User ID required');
    }

    return await storedNotification.getByUserId({ userId, pageSize, pageNum });
});

commands.register('notificationService.createStoredNotifications', async ({ storedNotifications }) => {
    const validationErrors = [];
    const createdNewStoredNotifications = [];

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
        throw new error.badRequest(`Invalid storedNotification data: ${validationErrors}`);
    }

    return createdNewStoredNotifications;
});

commands.register('notificationService.updateStoredNotification', async ({ id, data }) => {
    const validationErrors = [];

    if (!id) {
        throw new error.badRequest('StoredNotification ID required');
    }

    const obj = await storedNotification.getById({ id });

    if (!obj) {
        throw new error.notFound('StoredNotification not found');
    }

    delete data.id;

    const { errors } = validateStoredNotificationUpdate(data);

    if (errors?.length) {
        validationErrors.push(errors);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid storedNotification data: ${validationErrors}`);
    }

    return await storedNotification.update({ id, data });
});

commands.register('notificationService.deleteStoredNotification', async ({ id }) => {
    const obj = await storedNotification.getById({ id });

    if (!obj) {
        throw new error.notFound('StoredNotification not found');
    }

    return await storedNotification.delete({ id });
});
