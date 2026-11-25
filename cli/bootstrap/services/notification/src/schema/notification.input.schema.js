import { config } from '../config.js';

/**
 * Command input schemas, used as MCP tool input schemas
 */

// Get single notification input schema (MCP tool)
export const getSingleNotificationInputSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', description: 'Notification id' }
    },
    required: ['id'],
    additionalProperties: false
};

// Get many notifications input schema (MCP tool)
export const getManyNotificationsInputSchema = {
    type: 'object',
    properties: {
        pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 100, description: 'Number of notifications per page' },
        pageNum: { type: 'integer', minimum: 1, default: 1, description: 'Page number, starting at 1' }
    },
    additionalProperties: false
};

// Create notifications input schema (MCP tool), the parent notification with its email fields
export const createNotificationsInputSchema = {
    type: 'object',
    properties: {
        notifications: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: config.notificationTypes, description: 'Kind of notification' },
                    userId: { type: ['string', 'null'], description: 'Id of the user the notification is for' },
                    idempotencyKey: { type: ['string', 'null'], description: 'A repeat with the same key is not sent twice' },
                    emailAddress: { type: 'string', format: 'email', description: 'Recipient email address' },
                    ccEmailAddresses: { type: 'array', items: { type: 'string', format: 'email' } },
                    bccEmailAddresses: { type: 'array', items: { type: 'string', format: 'email' } },
                    replyToEmail: { type: ['string', 'null'], format: 'email' },
                    fromEmail: { type: 'string', format: 'email', description: `Sender email address, normally ${config.email.from}` },
                    subjectLine: { type: 'string' },
                    content: { type: 'string', description: 'Email body as HTML, required unless templateSlug is given' },
                    templateSlug: { type: ['string', 'null'], description: 'Template to compile the body from, required unless content is given' },
                    templateData: { type: 'object', additionalProperties: true, description: 'Parameters for the template' }
                },
                required: ['type', 'emailAddress', 'fromEmail', 'subjectLine'],
                additionalProperties: false,
                anyOf: [
                    { required: ['content'] },
                    { required: ['templateSlug'] }
                ]
            }
        }
    },
    required: ['notifications'],
    additionalProperties: false
};
