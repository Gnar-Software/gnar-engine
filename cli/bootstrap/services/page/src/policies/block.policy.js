export const authorise = {

    /**
     * Authorise get single block
     */
    getSingle: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise get many blocks
     */
    getMany: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise create blocks
     */
    create: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise update block
     */
    update: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise delete block
     */
    delete: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    }
}
