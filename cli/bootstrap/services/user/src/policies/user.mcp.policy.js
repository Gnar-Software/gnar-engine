import { error } from '@gnar-engine/core';


export const authoriseMcp = {

    /**
     * Authorise get single user over MCP
     *
     * @param {Object} params
     * @param {Object} params.user - The MCP authenticated user
     * @param {Object} params.payload - The command payload
     */
    getSingle: async ({ user, payload }) => {
        if (user.role !== 'service_admin' && payload.id !== user.id) {
            throw new error.unauthorised('not authorised');
        }
    },

    /**
     * Authorise get many users over MCP
     *
     * @param {Object} params
     * @param {Object} params.user - The MCP authenticated user
     */
    getMany: async ({ user }) => {
        if (user.role !== 'service_admin') {
            throw new error.unauthorised('not authorised');
        }
    },

    /**
     * Authorise search users over MCP
     *
     * @param {Object} params
     * @param {Object} params.user - The MCP authenticated user
     */
    search: async ({ user }) => {
        if (user.role !== 'service_admin') {
            throw new error.unauthorised('not authorised');
        }
    },

    /**
     * Authorise create users over MCP
     *
     * @param {Object} params
     * @param {Object} params.user - The MCP authenticated user
     */
    create: async ({ user }) => {
        if (user.role !== 'service_admin') {
            throw new error.unauthorised('not authorised');
        }
    },

    /**
     * Authorise update user over MCP
     *
     * @param {Object} params
     * @param {Object} params.user - The MCP authenticated user
     */
    update: async ({ user }) => {
        if (user.role !== 'service_admin') {
            throw new error.unauthorised('not authorised');
        }
    },

    /**
     * Authorise delete user over MCP
     *
     * @param {Object} params
     * @param {Object} params.user - The MCP authenticated user
     */
    delete: async ({ user }) => {
        if (user.role !== 'service_admin') {
            throw new error.unauthorised('not authorised');
        }
    },

    /**
     * Authorise request password reset over MCP
     *
     * @param {Object} params
     * @param {Object} params.user - The MCP authenticated user
     */
    requestPasswordReset: async ({ user }) => {
        if (user.role !== 'service_admin') {
            throw new error.unauthorised('not authorised');
        }
    }
}
