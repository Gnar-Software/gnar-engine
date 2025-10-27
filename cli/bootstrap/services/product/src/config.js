/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'productService',

    // microservice | modular-monolith
    architecture: process.env.GLOBAL_ARCHITECTURE || 'microservice',

    // web server
    http: {
        allowedOrigins: [],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        rateLimiting: {
			max: 5,
			timeWindow: '1 minute',
		}
    },

    // database
    db: {
        // type: mongodb | mysql
        type: 'mysql',

        // MongoDB
        connectionUrl: process.env.PRODUCT_MONGO_URL,
        connectionArgs: {},

        // MySQL
        host: process.env.PRODUCT_MYSQL_HOST,
        user: process.env.PRODUCT_MYSQL_USER,
        password: process.env.PRODUCT_MYSQL_PASSWORD,
        database: process.env.PRODUCT_MYSQL_DATABASE,
        connectionLimit: 10,
        queueLimit: 20,
        maxRetries: 5
    },

    // message broker
    message: {
        queueName: 'productServiceQueue',
        prefetch: 20
    },

    webSockets: {
        reconnectInterval: 5000,
        maxInitialConnectionAttempts: 5
    },

    hashNameSpace: '',
}
