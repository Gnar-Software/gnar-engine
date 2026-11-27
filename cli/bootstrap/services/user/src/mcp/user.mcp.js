import { authoriseMcp } from '../policies/user.mcp.policy.js';
import {
    getSingleUserInputSchema,
    getManyUsersInputSchema,
    searchUsersInputSchema,
    createUserWithRandomPasswordInputSchema,
    updateUserInputSchema,
    deleteUserInputSchema,
    requestPasswordResetInputSchema
} from '../schema/user.input.schema.js';


/**
 * User MCP tool definitions, keyed by command name (userService.<key>)
 */
export const userMcp = {

    getSingleUser: {
        title: 'Get user',
        description: 'Get a single user by id or email. Provide either id or email. Returns the user (id, email, username, role, contactId, timestamps) or null if not found.',
        inputSchema: getSingleUserInputSchema,
        annotations: { readOnlyHint: true },
        policy: authoriseMcp.getSingle
    },

    getManyUsers: {
        title: 'List users',
        description: 'List users ordered by email, paginated. Optionally restrict to a list of user ids. Returns { data: users[], pagination: { pageSize, pageNum, total } }.',
        inputSchema: getManyUsersInputSchema,
        annotations: { readOnlyHint: true },
        policy: authoriseMcp.getMany
    },

    searchUsers: {
        title: 'Search users',
        description: 'Search users by email or username. Returns a paginated list of matching users.',
        inputSchema: searchUsersInputSchema,
        annotations: { readOnlyHint: true },
        policy: authoriseMcp.search
    },

    createUserWithRandomPassword: {
        title: 'Create users',
        description: 'Create one or more users with a random password. Emails must be unique. Set sendNotification to email each new user an invitation to claim their account and set their own password. Returns the created users.',
        inputSchema: createUserWithRandomPasswordInputSchema,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        policy: authoriseMcp.create
    },

    updateUser: {
        title: 'Update user',
        description: 'Update a user by id. Only the provided fields in newUserData are changed. Emails must be unique. Returns the updated user.',
        inputSchema: updateUserInputSchema,
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        policy: authoriseMcp.update
    },

    deleteUser: {
        title: 'Delete user',
        description: 'Permanently delete a user by id. This cannot be undone.',
        inputSchema: deleteUserInputSchema,
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        policy: authoriseMcp.delete
    },

    requestPasswordReset: {
        title: 'Send password reset',
        description: 'Email a user a password reset link. Set claimAccount to send the claim your account invitation wording instead, e.g. for users created without a password.',
        inputSchema: requestPasswordResetInputSchema,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        policy: authoriseMcp.requestPasswordReset
    }

};
