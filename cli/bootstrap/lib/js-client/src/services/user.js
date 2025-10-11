import client from '../client.js';

export const user = {

    authenticate: async (username, password) => {
        try {
            const response = await client.post('/authenticate/', {
                username: username,
                password: password
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getMany: async () => {
        try {
            const response = await client.get('/users/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getUser: async (userId) => {
        try {
            const response = await client.get(`/users/${userId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createUser: async (user) => {
        try {
            const response = await client.post('/users/', {
                user: user
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    update: async (id, user) => {
        try {
            const response = await client.post(`/users/${id}`, {
                user: user
            });
            console.log('update user response', response);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    

    delete: async (userId) => {
        try {
            const response = await client.delete(`/users/${userId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}