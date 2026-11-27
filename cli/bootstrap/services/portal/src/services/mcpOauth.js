import client from './client.js';

export const mcpOauth = {
    getTransaction: async ({ id }) => {
        const { data } = await client.get(`/mcp/oauth/transactions/${encodeURIComponent(id)}/`);
        return data;
    },

    completeTransaction: async ({ id, decision }) => {
        const { data } = await client.post(`/mcp/oauth/transactions/${encodeURIComponent(id)}/complete/`, { decision });
        return data;
    },
};
