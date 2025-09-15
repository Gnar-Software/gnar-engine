import client from "../client.js";

export const checkout = {

    initialise: async ({cart}) => {
        try {
            const response = await client.post('/checkout/initialise', {
                cart: cart
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    earlyCapture: async ({contact, user, paymentIntentId}) => {
        try {
            const response = await client.post('/checkout/early-capture', {
                contact: contact,
                user: user,
                paymentIntentId: paymentIntentId || null
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    checkoutSubmit: async (orderData) => {
        try {
            const response = await client.post('/checkout/submit', {
                order: orderData
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

}