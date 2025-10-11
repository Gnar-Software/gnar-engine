import client from '../client.js';

export const products = {

    /**
     * 
     * @returns {Array} products
     */
    getMany: async () => {
        try {
            const response = await client.get('/products/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },


    /**
     *  Get a single product
     * @param {string} productId 
     * @returns 
     */
    getProduct: async (productId) => {
        try {
            const response = await client.get(`/products/${productId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },


    /**
     * Create products
     * 
     * @param {object} products
     * @returns
     */
    createProducts: async (products) => {
        try {
            const response = await client.post('/products/', {
                products: products
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update product
     * 
     * @param {string} id 
     * @param {object} product 
     * @returns 
     */
    update: async (id, product) => {
        try {
            const response = await client.post(`/products/${id}`, {
                product: product
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },


    /**
     * Delete product
     * 
     * @param {string} productId
     * @returns 
     */
    delete: async (productId) => {
        try {
            const response = await client.delete(`/products/${productId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }   
}
