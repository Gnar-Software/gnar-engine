import { commands } from '@gnar-engine/core';

export const messageHandlers = {

    getProduct: async (payload) => {
        let result;
        if (payload.data?.id) {
            result = await commands.execute('getSingleProduct', {
                id: payload.data.id
            });
        } else if (payload.data?.email) {
            result = await commands.execute('getSingleProduct', {
                email: payload.data.email
            });
        } else {
            throw new Error('No product ID or email provided');
        }
        if (!result) {
            throw new Error('Product not found');
        }
        return { product: result };
    },

    getManyProducts: async (payload) => {
        const results = await commands.execute('getManyProducts', {});
        return { products: results };
    },

    createProduct: async (payload) => {
        const results = await commands.execute('createProducts', {
            products: [payload.data.product]
        });
        return { products: results };
    },

    updateProduct: async (payload) => {
        const result = await commands.execute('updateProduct', {
            id: payload.data.id,
            newProductData: payload.data
        });
        return { product: result };
    },

    deleteProduct: async (payload) => {
        await commands.execute('deleteProduct', {
            id: payload.data.id
        });
        return { message: 'Product deleted' };
    },

};
