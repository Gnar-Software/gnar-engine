
/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'controlService',

    // environment
    environment: process.env.CONTROL_NODE_ENV || 'development',
    runTests: process.env.CONTROL_RUN_TESTS || false,
    resetDatabase: process.env.CONTROL_RESET_DATABASE || false,

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
        connectionUrl: process.env.CONTROL_MONGO_URL,
        connectionArgs: {},

        // MySQL
        host: process.env.CONTROL_MYSQL_HOST,
        user: process.env.CONTROL_MYSQL_USER,
        password: process.env.CONTROL_MYSQL_PASSWORD,
        database: process.env.CONTROL_MYSQL_DATABASE,
        // port: process.env.CONTROL_MYSQL_PORT,
        connectionLimit: 10,
        queueLimit: 200,
        maxRetries: 5
    },

    // message broker
    message: {
        url: process.env.RABBITMQ_URL,
        queueName: 'controlServiceQueue',
        prefetch: 20,
    },

    // central task scheduler
    tasks: {
        forwardScheduleNum: 1
    },

    // web socket client & server
    webSockets: {
        reconnectInterval: 5000,
        maxInitialConnectionAttempts: 5
    }
}
