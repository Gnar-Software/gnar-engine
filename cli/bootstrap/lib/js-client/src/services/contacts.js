import client from '../client.js';

export const contacts = {

    getMany: async () => {
        try {
            const response = await client.get('/contacts/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getContact: async (contactId) => {
        try {
            const response = await client.get(`/contacts/${contactId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createContact: async (contacts) => {
        try {
            const response = await client.post('/contacts/', 
                contacts
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },


    update: async (id, contact) => {
        try {
            const response = await client.post(`/contacts/${id}`, {
                contact: contact
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },


    delete: async (contactId) => {
        try {
            const response = await client.delete(`/contacts/${contactId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

}

