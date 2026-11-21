import { commands } from '@gnar-engine/core';

export const messageHandlers = {

    getMcp: async (payload) => {
        let result;
        if (payload.data?.id) {
            result = await commands.execute('getSingleMcp', {
                id: payload.data.id
            });
        } else if (payload.data?.email) {
            result = await commands.execute('getSingleMcp', {
                email: payload.data.email
            });
        } else {
            throw new Error('No mcp ID or email provided');
        }
        if (!result) {
            throw new Error('Mcp not found');
        }
        return { mcp: result };
    },

    getManyMcps: async (payload) => {
        const results = await commands.execute('getManyMcps', {});
        return { mcps: results };
    },

    createMcp: async (payload) => {
        const results = await commands.execute('createMcps', {
            mcps: [payload.data.mcp]
        });
        return { mcps: results };
    },

    updateMcp: async (payload) => {
        const result = await commands.execute('updateMcp', {
            id: payload.data.id,
            newMcpData: payload.data
        });
        return { mcp: result };
    },

    deleteMcp: async (payload) => {
        await commands.execute('deleteMcp', {
            id: payload.data.id
        });
        return { message: 'Mcp deleted' };
    },

};
