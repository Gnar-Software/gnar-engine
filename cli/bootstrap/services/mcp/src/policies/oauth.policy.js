export const authorise = {

    /**
     * Authorise get single OAuth transaction, the user must be signed in to the portal
     */
    getSingleTransaction: async (request, reply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'not authenticated' });
        }
    },

    /**
     * Authorise complete OAuth transaction, the user must be signed in to the portal
     */
    completeTransaction: async (request, reply) => {
        if (!request.user) {
            return reply.code(401).send({ error: 'not authenticated' });
        }
    }
}
