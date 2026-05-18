import { schema } from '@gnar-engine/core';
import { config } from '../config.js';


// Notification create schema
const notificationSchema = {
    schemaName: 'notificationService.notificationSchema',
    schema: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: config.notificationTypes },
            userId: { type: 'string' },
            idempotencyKey: { type: 'string', nullable: true}
        },
        required: [],
        additionalProperties: false
    }
};

// Notification update schema
const notificationUpdateSchema = {
    schemaName: 'notificationService.notificationUpdateSchema',
    schema: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: config.notificationTypes },
            userId: { type: 'string' },
            archived: { type: 'boolean' },
            idempotencyKey: { type: 'string', nullable: true}
        },
        required: [],
        additionalProperties: false
    }
};

// Template create schema
const notificationTemplateSchema = {
    schemaName: 'notificationService.notificationTemplateSchema',
    schema: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            content: { type: 'string' },
        },
        required: ['name', 'slug', 'content'],
        additionalProperties: false
    }
};

export const validateNotification = schema.compile(notificationSchema);
export const validateNotificationUpdate = schema.compile(notificationUpdateSchema);
export const validateNotificationTemplate = schema.compile(notificationTemplateSchema);
