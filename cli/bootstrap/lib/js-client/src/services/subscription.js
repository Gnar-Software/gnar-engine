import client from "../client.js";

export const subscription = {

    // Get all subscriptions
    getSubscriptions: async () => {
        try {
            const response = await client.get('/subscriptions/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get a single subscription
    getSubscription: async (subscriptionID) => {
        try {
            const response = await client.get(`/subscriptions/${subscriptionID}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Create a subscription
    createSubscription: async (subscriptionData) => {
        try {
            const response = await client.post('/subscriptions/', { subscription: subscriptionData });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update a subscription
    updateSubscription: async (subscriptionID, subscriptionData) => {
        try {
            const response = await client.post(`/subscriptions/${subscriptionID}`, { subscription: subscriptionData });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Delete a subscription
    deleteSubscription: async (subscriptionID) => {
        try {
            const response = await client.delete(`/subscriptions/${subscriptionID}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

}