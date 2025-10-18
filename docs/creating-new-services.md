# Creating new services

Time to start building out your application by adding your own services!

## Deciding your service break down

When deciding on what services you need, you should consider that your services should align with business level domains. For example if you are building ecommerce capabilities you might have services such as `products`, `orders`, `customers`, `carts`, `stripe-payments` as well as perhaps a `checkout` service to aggregate carts, customers, orders and payments into one set of helpful endpoints for your front-end to use.

You should aim to keep your services small and focused on a single responsibility, whilst also ensuring that they are not too granular. Splitting your application into too many small services can lead to overly tight coupling and increased complexity in maintaining and managing your code base.

## Create a new service

To create a new service, use the following command and follow the prompts to set up the new service:

```bash
gnar create service my-service-name
```

Gnar Engine uses a database per service architecture for flexibility, scalability and isolation. You will be able to choose between a MYSQL or MongoDB database. 

This command will create a new directory for your service within the `services` directory of your project, containing the necessary boilerplate code and configuration files to get you started. This will include crud routes and handling as well as all the required wiring.


