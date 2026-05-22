import { schema } from '@gnar-engine/core';

const storedNotificationSchema = {
    schemaName: 'notificationService.storedNotificationSchema',
    schema: {
        type: 'object',
        properties: {
            notificationId: { type: 'string' },
            content: { type: 'object' },
            status: { type: 'string', enum: ['unread', 'read', 'archived'] }
        },
        required: ['notificationId', 'content'],
        additionalProperties: false
    }
};

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
};

export const validateStoredNotification = schema.compile(storedNotificationSchema);
export const validateStoredNotificationUpdate = schema.compile(storedNotificationUpdateSchema);
