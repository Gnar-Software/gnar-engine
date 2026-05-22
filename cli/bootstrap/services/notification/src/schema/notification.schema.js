import { schema } from '@gnar-engine/core';
import { config } from '../config.js';

const notificationSchema = {
    schemaName: 'notificationService.notificationSchema',
    schema: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: config.notificationTypes },
            userId: { type: 'string' },
            idempotencyKey: { type: ['string', 'null'] }
        },
        required: ['type'],
        additionalProperties: false
    }
};

const notificationUpdateSchema = {
    schemaName: 'notificationService.notificationUpdateSchema',
    schema: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: config.notificationTypes },
            userId: { type: 'string' },
            idempotencyKey: { type: ['string', 'null'] }
        },
        required: [],
        additionalProperties: false
    }
};

export const validateNotification = schema.compile(notificationSchema);
export const validateNotificationUpdate = schema.compile(notificationUpdateSchema);
