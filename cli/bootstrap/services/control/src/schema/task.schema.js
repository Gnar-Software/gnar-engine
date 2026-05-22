import { schema } from '@gnar-engine/core';
import { config } from '../config.js';

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
            handler: { type: 'string' },
            recurringTaskId: { type: 'string', nullable: true },
            rescheduleCentrallyOnFailure: { type: 'boolean', default: true },
            idempotencyKey: { type: 'string', nullable: true }
        },
        required: ['name', 'payload', 'scheduled', 'handler'],
        additionalProperties: false
    }
};

// Compile schemas
export const validateTask = schema.compile(taskSchema);
