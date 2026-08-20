import { schema } from '@gnar-engine/core';

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
export const validateService = schema.compile(serviceSchema);
