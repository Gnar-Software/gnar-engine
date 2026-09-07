import { schema } from '@gnar-engine/core';
import { config } from '../config.js';

/**
 * The parent notification. Everything particular to a kind of notification is
 * validated by that kind's own schema.
 */
const notificationSchema = {
    schemaName: 'notificationService.notificationSchema',
    schema: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: config.notificationTypes },
            userId: { type: ['string', 'null'] },
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
            userId: { type: ['string', 'null'] },
            idempotencyKey: { type: ['string', 'null'] }
        },
        required: [],
        additionalProperties: false
    }
};

export const validateNotification = schema.compile(notificationSchema);
export const validateNotificationUpdate = schema.compile(notificationUpdateSchema);
