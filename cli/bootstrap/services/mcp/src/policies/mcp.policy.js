import { config } from '../config.js';

export const authorise = {

    /**
     * Authorise use of the MCP server
     */
    canUseMcp: async (request, reply) => {

        // validate origin to prevent DNS rebinding attacks (required by the MCP spec)
        if (request.headers.origin && !config.http.allowedOrigins.includes(request.headers.origin)) {
            return reply.code(403).send({ error: 'origin not allowed' });
        }

        // user must be logged in (OAuth to follow in the user service)
        if (!request.user) {
            return reply.code(401).send({ error: 'not authenticated' });
        }

        // service admins only until per tool access control is added
        if (request.user.role !== 'service_admin') {
            return reply.code(403).send({ error: 'not authorised' });
        }
    }
}
