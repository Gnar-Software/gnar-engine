import { schema } from '@gnar-engine/core';
import { config } from '../config.js';

export const mcpSchema = {
    schemaName: 'mcpService.mcpSchema',
    schema: {
        type: 'object',
        properties: {
            // Add your properties here
            
        },
        required: [],
        additionalProperties: false
    }
};

export const validateMcp = schema.compile(mcpSchema);
