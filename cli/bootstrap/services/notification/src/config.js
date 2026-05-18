/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'notificationService',

    // environment
    environment: process.env.NOTIFICATION_NODE_ENV || 'development',
    runTests: process.env.NOTIFICATION_RUN_TESTS || false,
    resetDatabase: process.env.NOTIFICATION_RESET_DATABASE || false,

    // microservice | modular-monolith
    architecture: process.env.GLOBAL_ARCHITECTURE || 'microservice',

    // web server
    http: {
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
        connectionUrl: process.env.NOTIFICATION_MONGO_URL,
        connectionArgs: {},

        // MySQL
        host: process.env.NOTIFICATION_MYSQL_HOST,
        user: process.env.NOTIFICATION_MYSQL_USER,
        password: process.env.NOTIFICATION_MYSQL_PASSWORD,
        database: process.env.NOTIFICATION_MYSQL_DATABASE,
        connectionLimit: 10,
        queueLimit: 20,
        maxRetries: 5
    },

    // AWS
    aws: {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },

    // message broker
    message: {
        url: process.env.RABBITMQ_URL,
        queueName: 'notificationServiceQueue',
        prefetch: 20
    },

    webSockets: {
        reconnectInterval: 5000,
        maxInitialConnectionAttempts: 5
    },

    hashNameSpace: '',

    // notification types for schema validation
    notificationTypes: ['email', 'stored'],

    // emails
    email: {
        from: process.env.NOTIFICATION_EMAIL_FROM || 'noreply@example.com',
        transport: (process.env.NOTIFICATION_EMAIL_TRANSPORT || 'log').toLowerCase(), // log | ses
        overrideTo: process.env.NOTIFICATION_EMAIL_OVERRIDE_TO || '',
    },
}
