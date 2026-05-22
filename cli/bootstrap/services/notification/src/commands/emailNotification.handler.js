import { commands, logger, error } from '@gnar-engine/core';
import { emailNotification } from '../services/emailNotification.service.js';
import { config } from '../config.js';
import { validateEmailNotification, validateEmailNotificationUpdate } from '../schema/emailNotification.schema.js';
import { sesService } from '../services/ses.service.js';
import { compileNotificationTemplate } from '../services/template.service.js';

commands.register('notificationService.compileTemplate', async ({ templateSlug, data = {} }) => {
    return await compileNotificationTemplate({ templateSlug, data });
});

commands.register('notificationService.getSingleEmailNotification', async ({ id }) => {
    if (!id) {
        throw new error.badRequest('EmailNotification id required');
    }

    return await emailNotification.getById({ id });
});

commands.register('notificationService.getEmailNotificationsByUserId', async ({ userId, pageSize, pageNum }) => {
    if (!userId) {
        throw new error.badRequest('User ID required');
    }

    return await emailNotification.getByUserId({ userId, pageSize, pageNum });
});

commands.register('notificationService.getManyEmailNotifications', async ({ pageSize, pageNum } = {}) => {
    return await emailNotification.getAll({ pageSize, pageNum });
});

commands.register('notificationService.createEmailNotifications', async ({ emailNotifications }) => {
    const validationErrors = [];
    const createdNewEmailNotifications = [];

    for (const emailNotificationObj of emailNotifications) {
        emailNotificationObj.fromEmail = emailNotificationObj.fromEmail || config.email?.from;

        const { errors } = validateEmailNotification(emailNotificationObj);
        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        if (!emailNotificationObj.templateSlug && !emailNotificationObj.content) {
            throw new error.badRequest('EmailNotification templateSlug missing and no content provided');
        }

        if (emailNotificationObj.templateSlug) {
            emailNotificationObj.content = await commands.execute('notificationService.compileTemplate', {
                templateSlug: emailNotificationObj.templateSlug,
                data: emailNotificationObj.templateData
            });
        }

        let createdEmailNotificationObj;

        try {
            createdEmailNotificationObj = await emailNotification.create({
                data: emailNotificationObj
            });
        } catch (err) {
            logger.error('Failed to create email notification', err);
            continue;
        }

        try {
            const scheduledTask = await commands.execute('controlService.scheduleTask', {
                task: {
                    name: 'sendEmailNotification',
                    handler: 'notificationService.sendEmailNotification',
                    payload: {
                        notificationId: emailNotificationObj.notificationId
                    },
                    scheduled: new Date(),
                    idempotencyKey: emailNotificationObj.idempotencyKey || null,
                    rescheduleCentrallyOnFailure: true
                }
            });

            logger.info('scheduled email sending task', scheduledTask);

            if (scheduledTask.status === 'already_scheduled') {
                createdNewEmailNotifications.push(createdEmailNotificationObj);
                continue;
            }
        } catch (err) {
            logger.error(`Failed to schedule email notification ${emailNotificationObj.notificationId} for sending`, err);
        }

        createdNewEmailNotifications.push(createdEmailNotificationObj);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid emailNotification data: ${validationErrors}`);
    }

    return createdNewEmailNotifications;
});

commands.register('notificationService.updateEmailNotification', async ({ id, data }) => {
    const validationErrors = [];

    if (!id) {
        throw new error.badRequest('EmailNotification ID required');
    }

    const obj = await emailNotification.getById({ id });

    if (!obj) {
        throw new error.notFound('EmailNotification not found');
    }

    delete data.id;

    const { errors } = validateEmailNotificationUpdate(data);

    if (errors?.length) {
        validationErrors.push(errors);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid emailNotification data: ${validationErrors}`);
    }

    return await emailNotification.update({ id, data });
});

commands.register('notificationService.deleteEmailNotification', async ({ id }) => {
    const obj = await emailNotification.getById({ id });

    if (!obj) {
        throw new error.notFound('EmailNotification not found');
    }

    return await emailNotification.delete({ id });
});

commands.register('notificationService.sendEmailNotification', async ({ id, notificationId } = {}) => {
    if (!id && !notificationId) {
        throw new error.badRequest('EmailNotification id or notificationId required');
    }

    const notificationObj = id
        ? await emailNotification.getById({ id })
        : await emailNotification.getLatestByNotificationId({ notificationId });

    if (!notificationObj) {
        throw new error.notFound('EmailNotification not found');
    }

    if (notificationObj.status === 'sent') {
        return { ok: true, message: 'Already sent', emailNotification: notificationObj };
    }

    try {
        if (!notificationObj.from_email) {
            throw new Error('fromEmail missing');
        }

        if (!notificationObj.email_address) {
            throw new Error('emailAddress missing');
        }

        if (!notificationObj.subject_line) {
            throw new Error('subjectLine missing');
        }

        if (!notificationObj.content) {
            throw new Error('content missing');
        }

        const parseAddresses = value => {
            if (!value) {
                return [];
            }

            return typeof value === 'string' ? JSON.parse(value) : value;
        };

        const sendRes = await sesService.sendEmail({
            from: notificationObj.from_email,
            to: notificationObj.email_address,
            cc: parseAddresses(notificationObj.cc_email_addresses),
            bcc: parseAddresses(notificationObj.bcc_email_addresses),
            subject: notificationObj.subject_line,
            html: notificationObj.content,
            text: null
        });

        const updated = await emailNotification.markSent({ id: notificationObj.id });

        return {
            ok: true,
            messageId: sendRes?.messageId,
            emailNotification: updated
        };
    } catch (err) {
        logger.error(err.message, 'Failed to send email notification');

        try {
            await emailNotification.markFailed({ id: notificationObj.id });
        } catch {
            logger.error(`Failed to mark email notification ${notificationObj.id} as failed`);
        }

        throw err;
    }
});
