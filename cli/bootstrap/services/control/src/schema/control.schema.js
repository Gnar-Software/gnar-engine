import { schema } from '@gnar-engine/core';

// Service schema
const serviceSchema = {
    schemaName: 'controlService.serviceSchema',
    schema: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            manifest: {
                type: 'object',
                properties: {
                    description: { type: 'string' },
                    commandList: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    commandImplementations: { type: 'object' },
                    schemas: { type: 'object' }
                },
                required: ['commandList', 'commandImplementations', 'schemas'],
                additionalProperties: false
            }
        },
        required: ['name', 'manifest'],
        additionalProperties: false
    }
};

// Compile schemas
export const validateService = schema.compile(serviceSchema);
