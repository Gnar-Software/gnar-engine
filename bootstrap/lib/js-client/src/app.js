import { user } from './services/user.js'
import { products } from './services/products.js'
import { contacts } from './services/contacts.js'
import { cart } from './services/cart.js';
import { checkout } from './services/checkout.js';
import { order } from './services/order.js';
import { datalayer } from './services/datalayer.js';
import { subscription } from './services/subscription.js';

const gnarEngine = {
    user: user,
    products: products,
    contacts: contacts,
    cart: cart,
    checkout: checkout,
    datalayer: datalayer,
    order: order,
    subscription: subscription,
}

export default gnarEngine;

