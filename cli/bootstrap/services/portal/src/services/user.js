import client from './client.js';

export const user = {
    authenticate: async ({ username, password }) => {
        const { data } = await client.post('/authenticate/', { username, password });
        return data;
    },

    getMany: async ({ page, pageSize } = {}) => {
        const queryParams = new URLSearchParams();

        if (page) {
            queryParams.append('pageNum', page);
        }

        if (pageSize) {
            queryParams.append('pageSize', pageSize);
        }

        const url = `/users/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const { data } = await client.get(url);
        return data;
    },

    getUser: async ({ userId }) => {
        const { data } = await client.get(`/users/${userId}`);
        return data;
    },

    createUser: async ({ user }) => {
        const { data } = await client.post('/users/', { user });
        return data;
    },

    update: async ({ id, user }) => {
        const { data } = await client.post(`/users/${id}`, user);
        return data;
    },

    updateMyProfile: async ({ id, data }) => {
        const { data: responseData } = await client.post(`/users/${id}/profile`, data);
        return responseData;
    },

    delete: async ({ userId }) => {
        await client.delete(`/users/${userId}`);
    },

    sendPasswordReset: async ({ email, createComplexPassword = false }) => {
        await client.post('/users/request-password-reset', { email, createComplexPassword });
    },

    changePassword: async ({ email, token, password }) => {
        await client.post('/users/change-password', { email, token, password });
    },
};
