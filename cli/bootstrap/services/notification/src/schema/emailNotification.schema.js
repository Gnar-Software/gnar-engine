import { schema } from '@gnar-engine/core';

/**
 * An email notification carries either its own content or the slug of a
 * template to compile it from, so one of the two has to be there.
 */
const emailNotificationSchema = {
    schemaName: 'notificationService.emailNotificationSchema',
    schema: {
        type: 'object',
        properties: {
            notificationId: { type: 'string' },
            emailAddress: { type: 'string', format: 'email' },
            ccEmailAddresses: { type: 'array', items: { type: 'string', format: 'email' } },
            bccEmailAddresses: { type: 'array', items: { type: 'string', format: 'email' } },
            replyToEmail: { type: ['string', 'null'], format: 'email' },
            fromEmail: { type: 'string', format: 'email' },
            subjectLine: { type: 'string' },
            content: { type: 'string' },
            templateSlug: { type: ['string', 'null'] },
            templateData: { type: 'object', additionalProperties: true },
            idempotencyKey: { type: ['string', 'null'] },
            status: { type: 'string', enum: ['pending', 'sent', 'failed'] },
            sentAt: { type: ['string', 'null'], format: 'date-time' },
        },
        required: ['notificationId', 'emailAddress', 'fromEmail', 'subjectLine'],
        additionalProperties: false,
        anyOf: [
            { required: ['content'] },
            { required: ['templateSlug'] }
        ]
    },
};

const emailNotificationUpdateSchema = {
    schemaName: 'notificationService.emailNotificationUpdateSchema',
    schema: {
        type: 'object',
        properties: {
            status: { type: 'string', enum: ['pending', 'sent', 'failed'] },
            updatedByUser: { type: 'string' }
        },
        additionalProperties: false
    }
};

export const validateEmailNotification = schema.compile(emailNotificationSchema);
export const validateEmailNotificationUpdate = schema.compile(emailNotificationUpdateSchema);
