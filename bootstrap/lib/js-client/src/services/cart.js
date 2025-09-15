import client from "../client.js";

export const cart = {

    getSingle: async (id) => {
        try {
            const response = await client.get(`/cart/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    update: async (cart) => {
        try {
            console.log('cart', cart);  
            const response = await client.post('/cart/', {
                cart: cart 
        });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

}   
