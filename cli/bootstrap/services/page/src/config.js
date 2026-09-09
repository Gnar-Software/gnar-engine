/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'pageService',

    // environment
    environment: process.env.PAGE_NODE_ENV || 'developnent',
    runTests: process.env.PAGE_RUN_TESTS || false,
    resetDatabase: process.env.PAGE_RESET_DATABASE || false,

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
        type: 'mongodb',

        // MongoDB
        host: process.env.PAGE_MONGO_HOST,
        database: process.env.PAGE_MONGO_DATABASE,
        user: process.env.PAGE_MONGO_USER,
        password: process.env.PAGE_MONGO_PASSWORD,
        port: process.env.PAGE_MONGO_PORT || 27017,
        connectionArgs: {},
    },

    // storage
    storage: {
        // driver: s3
        driver: 's3',
        uploadsUrl: process.env.UPLOADS_URL,

        // s3
        bucket: process.env.S3_BUCKET,
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },

    // message broker
    message: {
        url: process.env.RABBITMQ_URL,
        queueName: 'pageServiceQueue',
        prefetch: 20
    },

    webSockets: {
        reconnectInterval: 5000,
        maxInitialConnectionAttempts: 5
    },

    hashNameSpace: '',

    // Gnar Cloud
    // Log aggregation switches on from GLOBAL_LOGGER_MODE and the tenant context the platform
    // injects, not from this block. These are optional overrides for the logger's batching.
    cloud: {
        logger: {
            flushIntervalMs: 2000,
            batchSize: 500,
            maxBatchBytes: 800 * 1024,
            maxBufferSize: 10000,
            timeoutMs: 5000,
            maxRetries: 3
        }
    }
}
