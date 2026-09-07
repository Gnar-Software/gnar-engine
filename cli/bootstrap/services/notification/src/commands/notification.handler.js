import { commands, logger, error } from '@gnar-engine/core';
import { notification } from '../services/notification.service.js';
import { validateNotification, validateNotificationUpdate } from '../schema/notification.schema.js';

/**
 * Get single notification
 */
commands.register('notificationService.getSingleNotification', async ({ id }) => {
    if (!id) {
        throw new error.badRequest('Notification id required');
    }

    return await notification.getById({ id });
});

/**
 * Get many notifications
 */
commands.register('notificationService.getManyNotifications', async ({ pageSize, pageNum } = {}) => {
    return await notification.getAll({ pageSize, pageNum });
});

/**
 * Create notifications
 *
 * The parent row carries the kind of notification; everything else in the
 * object is handed to the handler for that kind, which stores it and takes it
 * from there.
 */
commands.register('notificationService.createNotifications', async ({ notifications }) => {
    const validationErrors = [];
    const createdNewNotifications = [];

    for (const data of notifications) {

        const notificationData = {
            type: data.type,
            userId: data.userId ?? null,
            idempotencyKey: data.idempotencyKey ?? null,
        };

        const restData = { ...data };
        delete restData.type;
        delete restData.userId;

        const { errors } = validateNotification(notificationData);

        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        /**
         * A repeat under the same key is not sent twice. What it is instead
         * depends on what became of the first one: if that email never went,
         * the repeat is the sender asking again for something they never got,
         * and dropping it strands the notification with nobody able to raise it
         * a second time. So the send is retried on the record already stored
         * rather than a second record being written.
         */
        const existing = await notification.getByIdempotencyKey({
            idempotencyKey: data.idempotencyKey
        });

        if (existing) {
            logger.info(`Notification with idempotency key ${data.idempotencyKey} already exists`);

            if (existing.type === 'email') {
                const retried = await commands.execute('notificationService.retryFailedEmailNotification', {
                    notificationId: existing.id
                });

                if (retried) {
                    createdNewNotifications.push(retried);
                    continue;
                }
            }

            continue;
        }

        const created = await notification.create({ data: notificationData });

        let childNotifications = [];

        if (Object.keys(restData).length > 0) {
            switch (data.type) {
                case 'email':
                    childNotifications = await commands.execute('notificationService.createEmailNotifications', {
                        emailNotifications: [{ ...restData, notificationId: created.id }]
                    });
                    break;
                default:
                    logger.info(`Unknown notification type '${data.type}' for notification ${created.id}`);
            }
        }

        createdNewNotifications.push({ ...created, ...childNotifications[0] });
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid notification data: ${validationErrors}`);
    }

    // Carries what was acted on: written for the first time, or already stored
    // and sent again. A repeat that needed nothing doing is not in here, so an
    // empty return means every one of them had already been dealt with.
    return createdNewNotifications;
});

/**
 * Update notification
 */
commands.register('notificationService.updateNotification', async ({ id, data }) => {
    if (!id) {
        throw new error.badRequest('Notification id required');
    }

    const obj = await notification.getById({ id });

    if (!obj) {
        throw new error.notFound('Notification not found');
    }

    delete data.id;

    const { errors } = validateNotificationUpdate(data);

    if (errors?.length) {
        throw new error.badRequest(`Invalid notification data: ${errors}`);
    }

    return await notification.update({ id, data });
});

/**
 * Delete notification
 */
commands.register('notificationService.deleteNotification', async ({ id }) => {
    const obj = await notification.getById({ id });

    if (!obj) {
        throw new error.notFound('Notification not found');
    }

    return await notification.delete({ id });
});
