
/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'userService',

    // environment
    environment: process.env.USER_NODE_ENV || 'development',
    runTests: process.env.USER_RUN_TESTS || false,
    resetDatabase: process.env.USER_RESET_DATABASE || false,

    // microservice | modular-monolith
    architecture: process.env.GLOBAL_ARCHITECTURE || 'microservice',

    // web server
    http: {
        allowedOrigins: ['localhost', 'localhost:4003'],
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
        connectionLimit: 3,
        queueLimit: 30,
        maxRetries: 5
    },

    // message broker
    message: {
        url: process.env.RABBITMQ_URL,
        queueName: 'userServiceQueue',
        prefetch: 20
    },

    webSockets: {
        reconnectInterval: 5000,
        maxInitialConnectionAttempts: 5
    },

    // service specific config
    userRoles: [
        'service_admin',
        'admin',
        'customer'
    ],

    publicCanCreateRoles: [

    ],

    defaultUserRole: 'customer',

    authenticationOptions: {
        password_auth_enabled: true,
        api_key_auth_enabled: true
    },

    hashNameSpace: '8a07b16c-327f-45c5-9484-8d843f57bb4b',
}
