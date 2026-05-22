/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'notificationService',

    // environment
    environment: process.env.NOTIFICATION_NODE_ENV || 'development',
    runTests: process.env.NOTIFICATION_RUN_TESTS || false,

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

    notificationTypes: [
        'email',
        'stored'
    ],

    // email delivery
    email: {
        from: process.env.NOTIFICATION_EMAIL_FROM || 'no-reply@example.com',
        transport: process.env.NOTIFICATION_EMAIL_TRANSPORT || 'log',
        overrideTo: process.env.NOTIFICATION_EMAIL_OVERRIDE_TO || ''
    },

    // aws config for SES
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
        region: process.env.AWS_REGION || 'eu-west-2'
    },

    hashNameSpace: '',
}
