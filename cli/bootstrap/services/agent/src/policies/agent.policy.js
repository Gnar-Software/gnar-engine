import { config } from '../config.js';

export const authorise = {

    /**
     * Authorise agent prompt
     */
    agentPrompt: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    }
}
