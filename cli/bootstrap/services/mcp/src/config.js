/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'mcpService',

    // environment
    environment: process.env.MCP_NODE_ENV || 'development',
    runTests: process.env.MCP_RUN_TESTS || false,
    resetDatabase: process.env.MCP_RESET_DATABASE || false,

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
        connectionUrl: process.env.MCP_MONGO_URL,
        connectionArgs: {},

        // MySQL
        host: process.env.MCP_MYSQL_HOST,
        user: process.env.MCP_MYSQL_USER,
        password: process.env.MCP_MYSQL_PASSWORD,
        database: process.env.MCP_MYSQL_DATABASE,
        connectionLimit: 10,
        queueLimit: 20,
        maxRetries: 5
    },

    // message broker
    message: {
        url: process.env.RABBITMQ_URL,
        queueName: 'mcpServiceQueue',
        prefetch: 20
    },

    webSockets: {
        reconnectInterval: 5000,
        maxInitialConnectionAttempts: 5
    },

    hashNameSpace: '',
}
