import { error } from '@gnar-engine/core';


export const authoriseMcp = {

    /**
     * Authorise get single notification over MCP
     *
     * @param {Object} params
     * @param {Object} params.user - The MCP authenticated user
     */
    getSingle: async ({ user }) => {
        if (user.role !== 'service_admin') {
            throw new error.unauthorised('not authorised');
        }
    },

    /**
     * Authorise get many notifications over MCP
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
     * Authorise create notifications over MCP
     *
     * @param {Object} params
     * @param {Object} params.user - The MCP authenticated user
     */
    create: async ({ user }) => {
        if (user.role !== 'service_admin') {
            throw new error.unauthorised('not authorised');
        }
    }
}
