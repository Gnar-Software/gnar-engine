import { config } from '../config.js';
import { userUpdateSchema } from './user.schema.js';

/**
 * Command input schemas, used as MCP tool input schemas
 */

// Get single user input schema (MCP tool)
export const getSingleUserInputSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', description: 'User id' },
        email: { type: 'string', format: 'email', description: 'User email' }
    },
    additionalProperties: false
};

// Get many users input schema (MCP tool)
export const getManyUsersInputSchema = {
    type: 'object',
    properties: {
        pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 100, description: 'Number of users per page' },
        pageNum: { type: 'integer', minimum: 1, default: 1, description: 'Page number, starting at 1' },
        ids: { type: 'array', items: { type: 'string' }, description: 'Only return users with these ids' }
    },
    additionalProperties: false
};

// Search users input schema (MCP tool)
export const searchUsersInputSchema = {
    type: 'object',
    properties: {
        term: { type: 'string', minLength: 1, description: 'Search term, matched against email and username' },
        pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 100, description: 'Number of users per page' },
        pageNum: { type: 'integer', minimum: 1, default: 1, description: 'Page number, starting at 1' }
    },
    required: ['term'],
    additionalProperties: false
};

// Create users with random password input schema (MCP tool)
export const createUserWithRandomPasswordInputSchema = {
    type: 'object',
    properties: {
        users: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: config.userRoles, default: config.defaultUserRole },
                    contactId: { type: 'string' },
                    username: { type: 'string' }
                },
                required: ['email'],
                additionalProperties: false
            }
        },
        sendNotification: { type: 'boolean', default: false, description: 'Email each new user a claim account invitation' }
    },
    required: ['users'],
    additionalProperties: false
};

// Update user input schema (MCP tool)
export const updateUserInputSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', description: 'User id' },
        newUserData: userUpdateSchema.schema
    },
    required: ['id', 'newUserData'],
    additionalProperties: false
};

// Delete user input schema (MCP tool)
export const deleteUserInputSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', description: 'User id' }
    },
    required: ['id'],
    additionalProperties: false
};

// Request password reset input schema (MCP tool)
export const requestPasswordResetInputSchema = {
    type: 'object',
    properties: {
        email: { type: 'string', format: 'email', description: 'User email' },
        createComplexPassword: { type: 'boolean', default: false, description: 'Require a complex password when setting the new one' },
        claimAccount: { type: 'boolean', default: false, description: 'Send the claim account invitation wording instead of the reset wording' }
    },
    required: ['email'],
    additionalProperties: false
};
