import client from './client.js';

export const user = {
    authenticate: async ({ username, password }) => {
        const { data } = await client.post('/authenticate/', { username, password });
        return data;
    },

    getMany: async () => {
        const { data } = await client.get('/users/');
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

    delete: async ({ userId }) => {
        await client.delete(`/users/${userId}`);
    },

    sendPasswordReset: async ({ email }) => {
        await client.post('/users/request-password-reset', { email });
    },

    changePassword: async ({ email, token, password }) => {
        await client.post('/users/change-password', { email, token, password });
    },
};
