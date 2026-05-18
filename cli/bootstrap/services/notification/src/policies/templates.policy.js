import { config } from '../config.js';

export const authorise = {

    /**
     * Authorise get single templates
     */
    getSingle: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise get many templatess
     */
    getMany: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise create templatess
     */
    create: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise update templates
     */
    update: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised WHAT'});
        }
    },

    /**
     * Authorise delete templates
     */
    delete: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    }
}
