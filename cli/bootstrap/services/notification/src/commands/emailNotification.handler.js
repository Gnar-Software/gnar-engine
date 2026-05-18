import { config } from '../config.js';
import { sesService } from '../services/ses.service.js';
import { commands, logger, error } from '@gnar-engine/core';
import { emailNotification } from '../services/emailNotification.service.js';
import { validateEmailNotification, validateEmailNotificationUpdate } from '../schema/emailNotification.schema.js';


/**
 * Get single emailNotification
 */
commands.register('notificationService.getSingleEmailNotification', async ({ id }) => {
    if (id) {
        return await emailNotification.getById({ id: id });
    } else {
        throw new error.badRequest('EmailNotification id required');
    }
});


/**
 * Get emailNotifications by user ID
 */
commands.register('notificationService.getEmailNotificationsByUserId', async ({ userId }) => {
    if (!userId) {
        throw new error.badRequest('User ID required');
    }

    return await emailNotification.getByUserId({ userId: userId });
});


/**
 * Get email template associated with email notification
 */
commands.register('notificationService.getEmailNotificationTemplate', async ({ emailId }) => {
    if (!emailId) {
        throw new error.badRequest('EmailNotification ID required');
    }

    return await emailNotification.getEmailTemplate({ emailId: emailId });
});


/**
 * Get many emailNotifications
 */
commands.register('notificationService.getManyEmailNotifications', async ({ }) => {
    return await emailNotification.getAll();
});


/**
 * Create emailNotifications
 */
commands.register('notificationService.createEmailNotifications', async ({ emailNotifications }) => {
    const validationErrors = [];
    const createdNewEmailNotifications = [];

    for (const emailNotificationObj of emailNotifications) {

        // validate
        const { errors } = validateEmailNotification(emailNotificationObj);
        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        if (!emailNotificationObj.templateSlug && !emailNotificationObj.content) {
            throw new error.badRequest('EmailNotification templateSlug missing and no content provided');
        }

        // compile email from template if templateSlug provided
        if (emailNotificationObj.templateSlug) {
            emailNotificationObj.content = await commands.execute('notificationService.compileTemplate', {
                templateSlug: emailNotificationObj.templateSlug,
                data: emailNotificationObj.templateData
            });
        }

        // schedule for immediate sending
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
                    rescheduleCentrallyOnFailure: true,
                }
            })

            logger.info('scheduled email sending task', scheduledTask);

            // bail if it's already scheduled
            if (scheduledTask.status == 'already_scheduled') {
                logger.info(`Email notification ${emailNotificationObj.notificationId} already scheduled for sending`);
                return;
            }

        } catch (error) {
            logger.error(`Failed to schedule email notification ${emailNotificationObj.notificationId} for sending `, error);
        }

        // store
        const created = await emailNotification.create({
            data: emailNotificationObj
        });

        // Default status is 'pending' on email creation - on scheduled task execution will need to change it to success

        // collect and return created emailNotifications
        createdNewEmailNotifications.push(created);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid emailNotification data: ${validationErrors}`);
    }

    return createdNewEmailNotifications;
});


/**
 * Update emailNotification
 * @param {Object} params
 * @param {string|number} params.id - EmailNotification ID
 * @param {Object} params.data - New emailNotification data
 * @returns {Promise<Object>} The updated emailNotification data
 */
commands.register('notificationService.updateEmailNotification', async ({ id, data }) => {

    const validationErrors = [];

    if (!id) {
        throw new error.badRequest('Emailnotification ID required');
    }

    const obj = await emailNotification.getById({ id: id });

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

    return await emailNotification.update({
        id: id,
        data
    });
});


/**
 * Delete emailnotification
 */
commands.register('notificationService.deleteEmailNotification', async ({ id }) => {
    const obj = await emailNotification.getById({ id: id });
    if (!obj) {
        throw new error.notFound('EmailNotification not found');
    }
    return await emailNotification.delete({ id: id });
});


/** TODO: Not implemented yet - just copy paste from McD
 * Send emailNotification (SES)
 * - Loads notification
 * - Renders template if templateSlug exists
 * - Sends email via SES
 * - Updates status + sentAt
 */
commands.register('notificationService.sendEmailNotification', async ({ id, notificationId, templateData } = {}) => {
    if (!id && !notificationId) {
        throw new error.badRequest('EmailNotification id or notificationId required');
    }

    let notificationObj = null;

    if (id) {
        notificationObj = await emailNotification.getById({ id });
    } else {
        notificationObj = await emailNotification.getLatestByNotificationId({ notificationId });
    }

    if (!notificationObj) {
        throw new error.notFound('EmailNotification not found');
    }

    if (notificationObj.status === 'sent') {
        return { ok: true, message: 'Already sent', emailNotification: notificationObj };
    }

    try {

        // validate
        if (!notificationObj.fromEmail) {
            throw new Error('fromEmail missing');
        }

        if (!notificationObj.emailAddress) {
            throw new Error('emailAddress missing');
        }

        if (!notificationObj.subjectLine) {
            throw new Error('subjectLine missing');
        }

        if (!notificationObj.content) {
            throw new Error('content missing');
        }

        // send email via SES
        const sendRes = await sesService.sendEmail({
            from: notificationObj.fromEmail ?? config?.email?.from,
            to: notificationObj.emailAddress,
            subject: notificationObj.subjectLine,
            html: notificationObj.content,
            text: null,
            cc: Array.isArray(notificationObj.ccEmailAddresses) ? notificationObj.ccEmailAddresses : [],
            bcc: Array.isArray(notificationObj.bccEmailAddresses) ? notificationObj.bccEmailAddresses : [],
        });

        const updated = await emailNotification.markSent({
            id: notificationObj.id,
        });

        return {
            ok: true,
            messageId: sendRes?.messageId,
            emailNotification: updated
        };

    } catch (err) {
        logger.error(err.message, 'Failed to send email notification');

        // mark as failed
        try {
            await emailNotification.markFailed({
                id: notificationObj.id,
            });
        } catch {
            logger.error(`Failed to mark email notification ${notificationObj.id} as failed`);
        }
    }
});
