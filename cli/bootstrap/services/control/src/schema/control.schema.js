import { schema } from '@gnar-engine/core';

// Task schema
const taskSchema = {
    schemaName: 'controlService.taskSchema',
    schema: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            payload: { type: 'object' },
            status: { type: 'string', enum: ['scheduled'] },
            scheduled: { type: 'string', format: 'mysql-date' },
            recurringInterval: { type: 'string', enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'] },
            recurringIntervalCount: { type: 'number' },
            handlerServiceName: { type: 'string' },
            handlerName: { type: 'string' },
            rescheduleCentrallyOnSuccess: { type: 'boolean' },
            rescheduleCentrallyOnFailure: { type: 'boolean' },
            idempotencyKey: { type: 'string' }
        },
        required: ['name', 'payload', 'scheduled', 'handlerServiceName', 'handlerName'],
        additionalProperties: false
    }
};

// Service schema
const serviceSchema = {
    schemaName: 'controlService.serviceSchema',
    schema: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            manifest: { type: 'object' }
        },
        required: ['name'],
        additionalProperties: false
    }
};

// Compile schemas
export const validateTask = schema.compile(taskSchema);
export const validateService = schema.compile(serviceSchema);
