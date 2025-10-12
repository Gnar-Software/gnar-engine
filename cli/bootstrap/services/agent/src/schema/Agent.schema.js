import { schema } from '@gnar-engine/core';
import { config } from '../config.js';

export const AgentSchema = {
    schemaName: 'agentService.AgentSchema',
    schema: {
        type: 'object',
        properties: {
            // Add your properties here
            
        },
        required: [],
        additionalProperties: false
    }
};

export const validateAgent = schema.compile(AgentSchema);
