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
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        rateLimiting: {
			max: 999,
			timeWindow: '1 minute',
		},
        bodyLimit: 5 * 1024 * 1024, // 5mb
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

    rebuilds: {
        pathBased: {
            enabled: process.env.PAGE_BUILD_REVALIDATE_ENABLED === 'true',
            endpointBase: process.env.PAGE_BUILD_ENDPOINT_BASE,
            endpointPath: '/api/revalidate',
            revalidateSecret: process.env.PAGE_BUILD_REVALIDATE_SECRET
        }
    }
}
