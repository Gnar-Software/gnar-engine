import { commands, logger, error } from '@gnar-engine/core';
import { notification } from '../services/notification.service.js';
import { validateNotification, validateNotificationUpdate } from '../schema/notification.schema.js';

commands.register('notificationService.getSingleNotification', async ({ id }) => {
    if (!id) {
        throw new error.badRequest('Notification id required');
    }

    return await notification.getById({ id });
});

commands.register('notificationService.getManyNotifications', async ({ pageSize, pageNum }) => {
    return await notification.getAll({ pageSize, pageNum });
});

commands.register('notificationService.getNotificationsByUserId', async ({ userId, pageSize, pageNum }) => {
    if (!userId) {
        throw new error.badRequest('User ID required');
    }

    const parentNotifications = await notification.getAllByUserId({ userId, pageSize, pageNum });
    const emailNotifications = await commands.execute('notificationService.getEmailNotificationsByUserId', { userId, pageSize, pageNum });
    const storedNotifications = await commands.execute('notificationService.getStoredNotificationsByUserId', { userId, pageSize, pageNum });
    const emailByParentId = new Map(emailNotifications.data.map(row => [row.notification_id, row]));
    const storedByParentId = new Map(storedNotifications.data.map(row => [row.notification_id, row]));

    return {
        ...parentNotifications,
        data: parentNotifications.data.map(parent => {
            if (parent.type === 'email') {
                return { ...parent, ...emailByParentId.get(parent.id) };
            }

            if (parent.type === 'stored') {
                return { ...parent, ...storedByParentId.get(parent.id) };
            }

            return parent;
        })
    };
});

commands.register('notificationService.getNotificationsByType', async ({ userId, type, pageSize, pageNum }) => {
    if (!userId || !type) {
        throw new error.badRequest('User ID and notification type required');
    }

    return await notification.getByType({ userId, type, pageSize, pageNum });
});

commands.register('notificationService.createNotifications', async ({ notifications }) => {
    const validationErrors = [];
    const createdNewNotifications = [];

    for (const data of notifications) {
        const notificationData = {
            type: data.type,
            userId: data.userId,
            idempotencyKey: data.idempotencyKey ?? null
        };

        const restData = { ...data };
        delete restData.type;
        delete restData.userId;
        delete restData.idempotencyKey;

        const { errors } = validateNotification(notificationData);

        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        const isIdempotent = await notification.checkIdempotent({
            idempotencyKey: data.idempotencyKey
        });

        if (!isIdempotent) {
            validationErrors.push(`Notification with idempotency key ${data.idempotencyKey} already exists`);
            continue;
        }

        const created = await notification.create({ data: notificationData });
        let childNotifications = [];

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
                logger.info(`Unknown notification type '${data.type}' for notification ID ${created.id}`);
        }

        createdNewNotifications.push({ ...created, ...childNotifications[0] });
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid notification data: ${validationErrors}`);
    }

    return createdNewNotifications;
});

commands.register('notificationService.updateNotification', async ({ id, data }) => {
    const validationErrors = [];

    if (!id) {
        throw new error.badRequest('Notification ID required');
    }

    const obj = await notification.getById({ id });

    if (!obj) {
        throw new error.notFound('Notification not found');
    }

    delete data.id;

    const { errors } = validateNotificationUpdate(data);

    if (errors?.length) {
        validationErrors.push(errors);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid notification data: ${validationErrors}`);
    }

    return await notification.update({ id, data });
});

commands.register('notificationService.deleteNotification', async ({ id }) => {
    const obj = await notification.getById({ id });

    if (!obj) {
        throw new error.notFound('Notification not found');
    }

    return await notification.delete({ id });
});
