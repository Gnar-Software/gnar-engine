import { commands, error } from '@gnar-engine/core';
import { storedNotification } from '../services/storedNotification.service.js';
import { validateStoredNotification, validateStoredNotificationUpdate } from '../schema/storedNotification.schema.js';

commands.register('notificationService.getSingleStoredNotification', async ({ id }) => {
    if (!id) {
        throw new error.badRequest('StoredNotification id required');
    }

    return await storedNotification.getById({ id });
}, {
    description: 'Get one stored notification by id.',
    parameters: {
        id: { type: ['string', 'number'], description: 'Stored notification ID' }
    }
});

commands.register('notificationService.getManyStoredNotifications', async ({ pageSize, pageNum } = {}) => {
    return await storedNotification.getAll({ pageSize, pageNum });
}, {
    description: 'Get a paginated list of stored notifications.',
    parameters: {
        pageSize: { type: 'number', description: 'Number of stored notifications per page' },
        pageNum: { type: 'number', description: 'Page number' }
    }
});

commands.register('notificationService.getStoredNotificationsByUserId', async ({ userId, pageSize, pageNum }) => {
    if (!userId) {
        throw new error.badRequest('User ID required');
    }

    return await storedNotification.getByUserId({ userId, pageSize, pageNum });
}, {
    description: 'Get a paginated list of stored notifications for one user.',
    parameters: {
        userId: { type: 'string', description: 'User ID' },
        pageSize: { type: 'number', description: 'Number of stored notifications per page' },
        pageNum: { type: 'number', description: 'Page number' }
    }
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
}, {
    description: 'Create one or more stored notifications.',
    parameters: {
        storedNotifications: {
            type: 'array',
            description: 'Stored notifications to create. Stored notification object details are available in notificationService.storedNotificationSchema.'
        }
    }
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
}, {
    description: 'Update one stored notification by id.',
    parameters: {
        id: { type: ['string', 'number'], description: 'Stored notification ID' },
        data: { type: 'object', description: 'Stored notification update data. Fields are available in notificationService.storedNotificationUpdateSchema.' }
    }
});

commands.register('notificationService.deleteStoredNotification', async ({ id }) => {
    const obj = await storedNotification.getById({ id });

    if (!obj) {
        throw new error.notFound('StoredNotification not found');
    }

    return await storedNotification.delete({ id });
}, {
    description: 'Delete one stored notification by id.',
    parameters: {
        id: { type: ['string', 'number'], description: 'Stored notification ID' }
    }
});
