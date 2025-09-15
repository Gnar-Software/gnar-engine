import { commands } from 'gnarengine-service-core';


/**
 * Message Controller: handlers for incoming service messages
 */
export const messageHandlers = {

    registerService: async (payload) => {
        const service = await commands.execute('registerService', {
            service: payload.data.service,
        });

        return { service };
    },

    getServices: async (payload) => {
        const services = await commands.execute('getServices', payload.data);
        
        return { services };
    },

    scheduleTask: async (payload) => {
        const task = await commands.execute('scheduleTask', payload.data);
        
        return { task };
    },

    cancelTasks: async (payload) => {
        const tasks = await commands.execute('cancelTasks', payload.data);
        
        return { tasks };
    },

    getManifests: async (payload) => {
        const manifests = await commands.execute('getManifests', payload.data);
        
        return { manifests };
    }
}
