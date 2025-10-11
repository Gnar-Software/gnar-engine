import { commands } from 'gnarengine-service-core';

export const messageHandlers = {

    getAgent: async (payload) => {
        let result;
        if (payload.data?.id) {
            result = await commands.execute('getSingleAgent', {
                id: payload.data.id
            });
        } else if (payload.data?.email) {
            result = await commands.execute('getSingleAgent', {
                email: payload.data.email
            });
        } else {
            throw new Error('No Agent ID or email provided');
        }
        if (!result) {
            throw new Error('Agent not found');
        }
        return { Agent: result };
    },

    getManyAgents: async (payload) => {
        const results = await commands.execute('getManyAgents', {});
        return { agents: results };
    },

    createAgent: async (payload) => {
        const results = await commands.execute('createAgents', {
            agents: [payload.data.Agent]
        });
        return { agents: results };
    },

    updateAgent: async (payload) => {
        const result = await commands.execute('updateAgent', {
            id: payload.data.id,
            newAgentData: payload.data
        });
        return { Agent: result };
    },

    deleteAgent: async (payload) => {
        await commands.execute('deleteAgent', {
            id: payload.data.id
        });
        return { message: 'Agent deleted' };
    },

};
