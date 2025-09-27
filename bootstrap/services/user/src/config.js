
/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'userService',

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
        connectionUrl: process.env.USER_MONGO_URL,
        connectionArgs: {},

        // MySQL
        host: process.env.USER_MYSQL_HOST,
        user: process.env.USER_MYSQL_USER,
        password: process.env.USER_MYSQL_PASSWORD,
        database: process.env.USER_MYSQL_DATABASE,
        connectionLimit: 10,
        queueLimit: 20,
        maxRetries: 5
    },

    // message broker
    message: {
        url: process.env.RABBITMQ_URL,
        queueName: 'userServiceQueue',
        prefetch: 20
    },

    // service specific config
    userRoles: [
        'service_admin',
        'admin',
        'customer'
    ],

    publicCanCreateRoles: [
        'customer'
    ],

    defaultUserRole: 'customer',

    authenticationOptions: {
        password_auth_enabled: true,
        api_key_auth_enabled: true
    },

    hashNameSpace: '8a07b16c-327f-45c5-9484-8d843f57bb4b',
}
