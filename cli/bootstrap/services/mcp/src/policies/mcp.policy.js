import { config } from '../config.js';

export const authorise = {

    /**
     * Initial policy to enable MCP access for a user
     */
    getSingle: async (request, reply) => {

        // initial check if users are logged in
        if (!request.user) {
            reply.code(403).send({error: 'not authorised'});
        }

        // further role based access control here

    }
}
