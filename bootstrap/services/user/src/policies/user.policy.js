import { config } from '../config.js';


export const authorise = {

    /**
     * Authorise get single user
     * 
     * @param {} request 
     * @param {*} reply 
     */
    getSingle: async (request, reply) => {
        if (!request.user) {
            reply.code(403).send({error: 'not authorised'});
        }

        if (request.user.role !== 'service_admin' && request.user.id !== request.params.id) {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise get many users
     */
    getMany: async (request, reply) => {
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise create users
     */
    create: async (request, reply) => {
        // If no role is provided check if default role is publicly creatable
        if (request.body.user?.role && config.publicCanCreateRoles.includes(request.body.user?.role)) {
            return;
        }

        // allow anyone to create default role or roles that don't require admin rights
        if (config.publicCanCreateRoles.includes(config.defaultUserRole)) {
            return;
        }
        
        // only admins can create other admin users
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise update user
     */
    update: async (request, reply) => {
        // users can update their own user
        if (request.user?.id === request.params.id) {
            // ensure the user is not trying to update their role to a non-publicly creatable role
            if (request.body?.role && !config.publicCanCreateRoles.includes(request.body?.role)) {
                reply.code(403).send({error: 'not authorised'});
            }

            // otherwise authorised
            return;
        }

        // only admins can update other users
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    },

    /**
     * Authorise delete user
     */
    delete: async (request, reply) => {
        // only admins can delete users
        if (!request.user || request.user.role !== 'service_admin') {
            reply.code(403).send({error: 'not authorised'});
        }
    }
}