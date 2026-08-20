import client from './client.js';

export const tasks = {
    getMany: async ({ status, orderDirection }) => {
        const queryParams = new URLSearchParams();

        if (status) {
            queryParams.append('status', status);
        }

        if (orderDirection) {
            queryParams.append('orderDirection', orderDirection);
        }

        const { data } = await client.get(`/tasks/?${queryParams.toString()}`);
        return data;
    },

    remove: async (id) => {
        const { data } = await client.delete(`/tasks/${id}`);
        return data;
    },

    getManyRecurring: async ({ page, pageSize, filters, orderBy }) => {
        const queryParams = new URLSearchParams();

        if (page) {
            queryParams.append('pageNum', page);
        }

        if (pageSize) {
            queryParams.append('pageSize', pageSize);
        }

        if (filters) {
            queryParams.append('filters', JSON.stringify(filters));
        }

        if (orderBy) {
            queryParams.append('orderBy', JSON.stringify(orderBy));
        }

        const { data } = await client.get(`/tasks/recurring?${queryParams.toString()}`);
        return data;
    },

    removeRecurring: async (id) => {
        const { data } = await client.delete(`/tasks/recurring/${id}`);
        return data;
    },
};
