
export const authorise = {

    /**
     * Authorise update product
     */
    scheduleTaskByApi: async (request, reply) => {
        // only service admins can schedule tasks via the API
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise execute task
     */
    executeTaskByApi: async (request, reply) => {
        // only service admins can execute tasks via the API
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise run migrations
     */
    runMigrationsByApi: async (request, reply) => {
        // only service admins can run migrations via the API
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise run seeders
     */
    runSeedersByApi: async (request, reply) => {
        // only service admins can run seeders via the API
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise run reset
     */
    runResetByApi: async (request, reply) => {
        // only service admins can run reset via the API
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    }
}