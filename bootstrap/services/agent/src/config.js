/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'agentService',

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
        connectionUrl: process.env.AGENT_MONGO_URL,
        connectionArgs: {},

        // MySQL
        host: process.env.AGENT_MYSQL_HOST,
        user: process.env.AGENT_MYSQL_USER,
        password: process.env.AGENT_MYSQL_PASSWORD,
        database: process.env.AGENT_MYSQL_DATABASE,
        connectionLimit: 10,
        queueLimit: 20,
        maxRetries: 5
    },

    // message broker
    message: {
        queueName: 'agentServiceQueue',
        prefetch: 20
    },

    hashNameSpace: '',

    agent: 'chatgpt' // Default agent type
}
