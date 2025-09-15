
export const datalayer = {

    /**
     * View single product
     * 
     * @param {Object} product
     * @param {String} currencyCode
     */
    viewProduct(product, currencyCode) {
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ ecommerce: null });

            let data = {
                'event': 'view_item',
                'ecommerce': {
                    'currency': currencyCode,
                    'value': price,
                    'items': [
                        {
                            'item_id': product._id,
                            'item_name': product.name,
                            'item_category': product.categories[0],
                            'price': product.skus[0].prices[0].price
                        }
                    ]
                }
            };

            window.dataLayer.push(data);
            console.log('DataLayer', data);

        } catch (error) {
            console.error(error);
        }
    },

    /**
     * Add to cart
     * 
     * @param {Object} product
     * @param {Number} productPrice
     * @param {String} currencyCode
     * @param {Number} quantity
     */
    addToCart(product, productPrice, currencyCode, quantity) {
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ ecommerce: null });

            let price;
            if (product.type == 'variable') {
                Object.values(product.variations).forEach(function (variation) {
                    price = variation.price;
                });
            } else {
                price = product.price;
            }

            let value = price * quantity;

            let data = {
                'event': 'add_to_cart',
                'ecommerce': {
                    'currency': currencyCode,
                    'value': value,
                    'items': [
                        {
                            'item_id': product._id,
                            'item_name': product.name,
                            'item_category': product.categories[0],
                            'price': productPrice,
                            'quantity': quantity
                        }
                    ]
                }
            };

            window.dataLayer.push(data);
            console.log('DataLayer', data);

        } catch (error) {
            console.error(error);
        }
    },

    /**
     * Begin checkout
     * 
     * @param {Object} cartData
     * @param {String} currencyCode
     */
    beginCheckout(cartData, currencyCode) {
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ ecommerce: null });

            let value = Math.round(cartData.total * 100) / 100;
            let items = [];

            cartData.lineItems.forEach(function (item) {
                let price = item.price / item.quantity;

                items.push({
                    'item_id': item.product_id,
                    'item_name': item.name,
                    'price': Math.round(item.price.price * 100) / 100,
                    'quantity': item.quantity
                });
            });

            let data = {
                'event': 'begin_checkout',
                'ecommerce': {
                    'currency': currencyCode,
                    'value': value,
                    'items': items
                }
            };

            window.dataLayer.push(data);
            console.log('DataLayer', data);

        } catch (error) {
            console.error(error);
        }
    },

    /**
     * Purchase
     * 
     * @param {Object} orderData
     */
    purchase(orderData) {
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ ecommerce: null });

            let value = Math.round(orderData.total * 100) / 100;
            let tax = Math.round(orderData.tax * 100) / 100 || 0;
            let shipping = Math.round(orderData.shipping * 100) / 100 || 0;
            let items = [];

            orderData.lineItems.forEach(function (item) {
                items.push({
                    'item_id': item.product_id,
                    'item_name': item.name,
                    'price': Math.round(item.price.price * 100) / 100,
                    'quantity': item.quantity
                });
            });

            let data = {
                'event': 'purchase',
                'ecommerce': {
                    'transaction_id': orderData._id,
                    'currency': orderData.currency,
                    'value': value,
                    'tax': tax,
                    'shipping': shipping,
                    'items': items
                }
            };

            window.dataLayer.push(data);
            console.log('DataLayer', data);

        } catch (error) {
            console.error(error);
        }
    }
}