/**
 * Command input schemas, used as MCP tool input schemas
 */

// Get single email notification input schema (MCP tool)
export const getSingleEmailNotificationInputSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', description: 'Email notification id' }
    },
    required: ['id'],
    additionalProperties: false
};

// Get many email notifications input schema (MCP tool)
export const getManyEmailNotificationsInputSchema = {
    type: 'object',
    properties: {
        pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 100, description: 'Number of email notifications per page' },
        pageNum: { type: 'integer', minimum: 1, default: 1, description: 'Page number, starting at 1' }
    },
    additionalProperties: false
};
