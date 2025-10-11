import client from "../client.js";

export const order = {

    // Get all orders
    getOrders: async () => {
        try {
            const response = await client.get('/orders/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get a single order
    getOrder: async (orderID) => {
        try {
            const response = await client.get(`/orders/${orderID}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Create an order
    createOrder: async (orderData) => {
        try {
            const response = await client.post('/orders/', { order: orderData });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update an order
    updateOrder: async (orderID, orderData) => {
        try {
            const response = await client.post(`/orders/${orderID}`, {
                order: orderData}
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Delete an order
    deleteOrder: async (orderID) => {
        try {
            const response = await client.delete(`/orders/${orderID}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
