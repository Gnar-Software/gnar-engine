import { commands, logger, error } from '@gnar-engine/core';
import { product } from '../services/product.service.js';
import { config } from '../config.js';
import { validateProduct } from '../schema/product.schema.js';


/**
 * Get single product
 */
commands.register('productService.getSingleProduct', async ({id}) => {
    if (id) {
        return await product.getById({id: id});
    } else {
        throw new error.badRequest('Product email or id required');
    }
});

/**
 * Get many products
 */
commands.register('productService.getManyProducts', async ({}) => {
    return await product.getAll();
});

/**
 * Create products
 */
commands.register('productService.createProducts', async ({ products }) => {
    const validationErrors = [];
    let createdNewProducts = [];

    for (const newData of products) {
        const { errors } = validateProduct(newData);
        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        const created = await product.create(newData);
        createdNewProducts.push(created);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid product data: ${validationErrors}`);
    }

    return createdNewProducts;
});

/**
 * Update product
 */
commands.register('productService.updateProduct', async ({id, newProductData}) => {
    
    const validationErrors = [];
    
    if (!id) {
        throw new error.badRequest('Product ID required');
    
    }
    
    const obj = await product.getById({id: id});
    
    if (!obj) {
        throw new error.notFound('Product not found');
    
    }
    
    delete newProductData.id;
    
    const { errors } = validateProductUpdate(newProductData);
    
    if (errors?.length) {
        validationErrors.push(errors);
    }
    
    if (validationErrors.length) {
        throw new error.badRequest(`Invalid product data: ${validationErrors}`);
    }
    
    return await product.update({
        id: id,
        ...newProductData
    });
});

/**
 * Delete product
 */
commands.register('productService.deleteProduct', async ({id}) => {
    const obj = await product.getById({id: id});
    if (!obj) {
        throw new error.notFound('Product not found');
    }
    return await product.delete({id: id});
});
