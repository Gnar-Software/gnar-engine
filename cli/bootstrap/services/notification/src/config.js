/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'notificationService',

    // environment
    environment: process.env.NOTIFICATION_NODE_ENV || 'dev',
    runTests: process.env.NOTIFICATION_RUN_TESTS || false,

    // microservice | modular-monolith
    architecture: process.env.GLOBAL_ARCHITECTURE || 'microservice',

    // web server
    http: {
        // Any browser origin that posts to this service has to be named here or
        // its preflight is refused
        allowedOrigins: [],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],

        /**
         * Passed straight to @fastify/rate-limit as the service wide default:
         * every route answers at most this often per client. A route open to the
         * public should carry a tighter limit of its own in this block and name
         * it in its own config.rateLimit, which the plugin reads in preference
         * to this default.
         */
        rateLimiting: {
            max: 20,
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

    // The kinds of notification this service stores. A parent notification row
    // carries the type and a child table carries the rest. Add a kind here, a
    // child table for it, and a branch in createNotifications that reaches it.
    notificationTypes: ['email'],

    // The window a repeated notification is treated as the same one. The same
    // person sending the same words twice inside it is a double submit, not a
    // second request, so the two collapse onto one idempotency key.
    idempotencyWindowMs: 10 * 60 * 1000,

    aws: {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },

    email: {
        from: process.env.NOTIFICATION_EMAIL_FROM || 'no-reply@localhost',

        // log | ses. Log writes the whole email to the service log and sends
        // nothing, which is what a developer machine wants.
        transport: (process.env.NOTIFICATION_EMAIL_TRANSPORT || 'log').toLowerCase(),

        // Off production, every email goes here instead of its real recipient
        overrideTo: process.env.NOTIFICATION_EMAIL_OVERRIDE_TO || '',
    },

    hashNameSpace: '',
}
