import { schema } from 'gnarengine-service-core';
import { config } from '../config.js';


// User create schema
const userSchema = {
    schemaName: 'userService.userSchema',
    schema: {
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            role: { type: 'string', enum: config.allowedUserRoles, default: config.defaultUserRole },
            contactId: { type: 'string' },
            username: { type: 'string' }
        },
        required: ['email', 'password'],
        additionalProperties: false
    }
};

// Service admin user create schema
const serviceAdminUserSchema = {
    schemaName: 'userService.serviceAdminUserSchema',
    schema: {
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['service_admin'] },
            contactId: { type: 'string' }
        },
        required: ['email'],
        additionalProperties: false
    }
};

// User update schema
const userUpdateSchema = {
    schemaName: 'userService.userUpdateSchema',
    schema: {
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: config.allowedUserRoles, default: config.defaultUserRole },
            contactId: { type: 'string' }
        },
        additionalProperties: false
    }
};

// Service admin user update schema
const serviceAdminUserUpdateSchema = {
    schemaName: 'userService.serviceAdminUserUpdateSchema',
    schema: {
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['service_admin'] },
            contactId: { type: 'string' }
        },
        additionalProperties: false
    }
};

// Compile schemas
export const validateUser = schema.compile(userSchema);
export const validateServiceAdminUser = schema.compile(serviceAdminUserSchema);
export const validateUserUpdate = schema.compile(userUpdateSchema);
export const validateServiceAdminUserUpdate = schema.compile(serviceAdminUserUpdateSchema);