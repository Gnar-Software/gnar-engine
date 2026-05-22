import { schema } from '@gnar-engine/core';
import { config } from '../config.js';

const statuses = ['active', 'paused', 'cancelled'];
const types = ['system', 'custom_job', 'user_scheduled'];

// Recurring task schema
const recurringTaskSchema = {
    schemaName: 'controlService.recurringTaskSchema',
    schema: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            payload: { type: 'object' },
            handler: { type: 'string' },
            startsAt: { type: 'string', format: 'mysql-date' },
            endsAt: { type: 'string', format: 'mysql-date', nullable: true },
            cronExpression: { type: 'string' },
            nextRunAt: { type: 'string', format: 'mysql-date' },
            status: {
                type: 'string',
                enum: statuses,
                default: 'active'
            },
            type: {
                type: 'string',
                enum: types,
                default: 'custom_job'
            },
            idempotencyKey: { type: 'string', nullable: true },
            rescheduleCentrallyOnFailure: { type: 'boolean', default: true }
        },
        required: ['name', 'payload', 'handler', 'startsAt', 'cronExpression'],
        additionalProperties: false
    }
};

export const validateRecurringTask = schema.compile(recurringTaskSchema);
