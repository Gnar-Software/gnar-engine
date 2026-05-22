import client from './client.js';

export const blocks = {
    getMany: async ({ page, pageSize } = {}) => {
        const queryParams = new URLSearchParams();

        if (page) {
            queryParams.append('pageNum', page);
        }

        if (pageSize) {
            queryParams.append('pageSize', pageSize);
        }

        const url = `/blocks/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const { data } = await client.get(url);
        return data;
    },

    getSingle: async ( id ) => {
        const { data } = await client.get(`/blocks/${id}`);
        return data;
    },

    create: async ( block ) => {
        const { data } = await client.post('/blocks/', { block });
        return data;
    },

    update: async ( id, block ) => {
        const { data } = await client.post(`/blocks/${id}`, { block });
        return data;
    },

    delete: async ( id ) => {
        await client.delete(`/blocks/${id}`);
    }
};
