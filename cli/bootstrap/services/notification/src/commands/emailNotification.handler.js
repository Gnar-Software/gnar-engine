import { commands, logger, error } from '@gnar-engine/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import { emailNotification } from '../services/emailNotification.service.js';
import { sesService } from '../services/ses.service.js';
import { config } from '../config.js';
import { validateEmailNotification, validateEmailNotificationUpdate } from '../schema/emailNotification.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Compile a handlebars template from ../templates/
 */
commands.register('notificationService.compileTemplate', async ({ templateSlug, data = {} }) => {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateSlug}.hbs`);
    const source = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(source);

    return template(data);
});

/**
 * Get single email notification
 */
commands.register('notificationService.getSingleEmailNotification', async ({ id }) => {
    if (!id) {
        throw new error.badRequest('EmailNotification id required');
    }

    return await emailNotification.getById({ id });
});

/**
 * Get many email notifications
 */
commands.register('notificationService.getManyEmailNotifications', async ({ pageSize, pageNum } = {}) => {
    return await emailNotification.getAll({ pageSize, pageNum });
});

/**
 * Create email notifications
 *
 * Compiles the body from its template, stores it, then asks the control service
 * to send it. The sending is a scheduled task rather than part of this request,
 * so a slow or unhappy mail transport cannot hold up the form the enquiry came
 * from, and a failed send can be retried centrally.
 */
commands.register('notificationService.createEmailNotifications', async ({ emailNotifications }) => {
    const validationErrors = [];
    const createdNewEmailNotifications = [];

    for (const emailNotificationObj of emailNotifications) {

        const { errors } = validateEmailNotification(emailNotificationObj);

        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        const { idempotencyKey, ...emailData } = emailNotificationObj;

        if (!emailData.templateSlug && !emailData.content) {
            throw new error.badRequest('EmailNotification needs either a templateSlug or content');
        }

        if (emailData.templateSlug) {
            emailData.content = await commands.execute('notificationService.compileTemplate', {
                templateSlug: emailData.templateSlug,
                data: emailData.templateData
            });
        }

        let created;

        try {
            created = await emailNotification.create({ data: emailData });
        } catch (err) {
            logger.error(err, 'Failed to create email notification');
            continue;
        }

        try {
            const scheduledTask = await commands.execute('controlService.scheduleTask', {
                task: {
                    name: 'sendEmailNotification',
                    handler: 'notificationService.sendEmailNotification',
                    payload: {
                        notificationId: emailData.notificationId
                    },
                    scheduled: new Date(),
                    idempotencyKey: idempotencyKey || null,
                    rescheduleCentrallyOnFailure: true,
                }
            });

            if (scheduledTask?.status === 'already_scheduled') {
                logger.info(`Email notification ${emailData.notificationId} already scheduled for sending`);
            }
        } catch (err) {
            // The control service is the one that would retry a failed send, so
            // with it unreachable there is nothing left to carry this email. Sent
            // here instead rather than left stored and never delivered: an
            // enquiry going missing because a second service is down is worse
            // than a slow reply to the form it came from.
            logger.error(err, `Could not schedule email notification ${emailData.notificationId}, sending it now instead`);

            try {
                await commands.execute('notificationService.sendEmailNotification', {
                    notificationId: emailData.notificationId
                });
            } catch (sendErr) {
                logger.error(sendErr, `Failed to send email notification ${emailData.notificationId}`);
            }
        }

        createdNewEmailNotifications.push(created);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid emailNotification data: ${validationErrors}`);
    }

    return createdNewEmailNotifications;
});

/**
 * Send again an email that failed
 *
 * Returns the notification when it took the retry, and null when there was
 * nothing to retry: no email against it, or one that is pending or already
 * gone. The caller uses that to tell a repeat worth acting on from one that
 * needs leaving alone.
 */
commands.register('notificationService.retryFailedEmailNotification', async ({ notificationId }) => {
    if (!notificationId) {
        throw new error.badRequest('Notification id required');
    }

    const existing = await emailNotification.getLatestByNotificationId({ notificationId });

    if (!existing || existing.status !== 'failed') {
        return null;
    }

    logger.info(`Email notification ${notificationId} failed before, sending it again`);

    // Back to pending first, so a send that fails a second time still reads as
    // failed rather than being left on whatever the last attempt set
    await emailNotification.update({ id: existing.id, data: { status: 'pending' } });

    try {
        await commands.execute('notificationService.sendEmailNotification', { notificationId });
    } catch (err) {
        logger.error(err, `Retry of email notification ${notificationId} failed again`);
    }

    return await emailNotification.getLatestByNotificationId({ notificationId });
});

/**
 * Update email notification
 */
commands.register('notificationService.updateEmailNotification', async ({ id, data }) => {
    if (!id) {
        throw new error.badRequest('EmailNotification id required');
    }

    const obj = await emailNotification.getById({ id });

    if (!obj) {
        throw new error.notFound('EmailNotification not found');
    }

    delete data.id;

    const { errors } = validateEmailNotificationUpdate(data);

    if (errors?.length) {
        throw new error.badRequest(`Invalid emailNotification data: ${errors}`);
    }

    return await emailNotification.update({ id, data });
});

/**
 * Delete email notification
 */
commands.register('notificationService.deleteEmailNotification', async ({ id }) => {
    const obj = await emailNotification.getById({ id });

    if (!obj) {
        throw new error.notFound('EmailNotification not found');
    }

    return await emailNotification.delete({ id });
});

/**
 * Send an email notification through the configured transport, and record
 * whether it went.
 */
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
        for (const field of ['fromEmail', 'emailAddress', 'subjectLine', 'content']) {
            if (!notificationObj[field]) {
                throw new Error(`${field} missing`);
            }
        }

        const sendRes = await sesService.sendEmail({
            from: notificationObj.fromEmail ?? config.email?.from,
            to: notificationObj.emailAddress,
            replyTo: notificationObj.replyToEmail,
            subject: notificationObj.subjectLine,
            html: notificationObj.content,
            text: null,
        });

        const updated = await emailNotification.markSent({ id: notificationObj.id });

        return {
            ok: true,
            messageId: sendRes?.messageId,
            emailNotification: updated
        };

    } catch (err) {
        logger.error(err, 'Failed to send email notification');

        try {
            await emailNotification.markFailed({ id: notificationObj.id });
        } catch {
            logger.error(`Failed to mark email notification ${notificationObj.id} as failed`);
        }

        throw err;
    }
});
