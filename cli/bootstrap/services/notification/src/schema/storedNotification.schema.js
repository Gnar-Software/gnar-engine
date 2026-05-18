import { schema } from '@gnar-engine/core';
import { config } from '../config.js';

// Stored notification create schema
const storedNotificationSchema = {
    schemaName: 'notificationService.storedNotificationSchema',
    schema: {
        type: 'object',
        properties: {
            notificationId: { type: 'string' },
            content: { type: 'object' },
            status: { type: 'string', enum: ['unread', 'read', 'archived'] },
        },
        required: ['notificationId', 'content'],
        additionalProperties: false
    },
}

// Stored notification update schema
const storedNotificationUpdateSchema = {
    schemaName: 'notificationService.storedNotificationUpdateSchema',
    schema: {
        type: 'object',
        properties: {
            status: { type: 'string', enum: ['unread', 'read', 'archived'] }
        },
        required: ['status'],
        additionalProperties: false
    }
}

export const validateStoredNotification = schema.compile(storedNotificationSchema);
export const validateStoredNotificationUpdate = schema.compile(storedNotificationUpdateSchema);