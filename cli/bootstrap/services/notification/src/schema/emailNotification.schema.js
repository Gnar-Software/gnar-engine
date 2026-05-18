import { schema } from '@gnar-engine/core';

// Email notification create schema
const emailNotificationSchema = {
    schemaName: 'notificationService.emailNotificationSchema',
    schema: {
        type: 'object',
        properties: {
            notificationId: { type: 'string' },
            toUserId: { type: 'string' },
            emailAddress: { type: 'array', items: { type: 'string', format: 'email' } },
            ccEmailAddresses: { type: 'array', items: { type: 'string', format: 'email' } },
            bccEmailAddresses: { type: 'array', items: { type: 'string', format: 'email' } },
            fromEmail: { type: 'string', format: 'email' },
            subjectLine: { type: 'string' },
            content: { type: 'string' },
            templateId: { type: 'string' },
            templateSlug: { type: 'string' },
            templateData: { type: 'object', additionalProperties: true },
            status: { type: 'string', enum: ['pending', 'sent', 'failed'] },
            sentAt: { type: ['string', 'null'], format: 'date-time' },
        },
        required: ['notificationId', 'emailAddress', 'fromEmail', 'subjectLine', 'content'],
        additionalProperties: false
    },
}

const emailNotificationUpdateSchema = {
    schemaName: 'notificationService.emailNotificationUpdateSchema',
    schema: {
        type: 'object',
        properties: {
            status: { type: 'string', enum: ['pending', 'sent', 'failed'] },
            updatedByUser: { type: 'string' }
        }
    }
}

export const validateEmailNotification = schema.compile(emailNotificationSchema);
export const validateEmailNotificationUpdate = schema.compile(emailNotificationUpdateSchema);
