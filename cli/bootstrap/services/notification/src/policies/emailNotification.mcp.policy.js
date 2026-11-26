import { error } from '@gnar-engine/core';


export const authoriseMcp = {

    /**
     * Authorise get single email notification over MCP
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
     * Authorise get many email notifications over MCP
     *
     * @param {Object} params
     * @param {Object} params.user - The MCP authenticated user
     */
    getMany: async ({ user }) => {
        if (user.role !== 'service_admin') {
            throw new error.unauthorised('not authorised');
        }
    }
}
