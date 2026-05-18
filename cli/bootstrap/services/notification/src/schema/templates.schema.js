import { schema } from '@gnar-engine/core';

export const templatesSchema = {
    schemaName: 'notificationService.templatesSchema',
    schema: {
        type: 'object',
        properties: {
            version: { type: 'integer' },

            name: { type: 'string', maxLength: 255 },
            description: { type: 'string', maxLength: 512 },
            subject: { type: ['string', 'null'], maxLength: 512 },
            content: { type: 'string' },
            variablesSchema: { type: ['object', 'null'] },
            createdBy: { type: 'string' },
            type: { type: 'string', maxLength: 255 },
            dataResolvers: { type: ['object', 'null'] },
            blocks: { type: ['object', 'null'] },
        },
        required: ['name', 'content', 'createdBy'],
        additionalProperties: false
    }
};

export const templatesUpdateSchema = {
    schemaName: 'notificationService.templatesUpdateSchema',
    schema: {
        type: 'object',
        properties: {
            latest: { type: 'boolean' },

            name: { type: 'string', maxLength: 255 },
            description: { type: 'string', maxLength: 512 },
            subject: { type: ['string', 'null'], maxLength: 512 },
            content: { type: 'string' },
            createdBy: { type: 'string' },
            variablesSchema: { type: ['object', 'null'] },
            dataResolvers: { type: ['object', 'null'] },
            blocks: { type: ['object', 'null'] },
            type: { type: 'string', maxLength: 255 },
            archived: { type: 'boolean' }
        },
        required: ['name', 'content', 'createdBy'],
        additionalProperties: false
    }
};

export const validateTemplates = schema.compile(templatesSchema);
export const validateTemplatesUpdate = schema.compile(templatesUpdateSchema);
