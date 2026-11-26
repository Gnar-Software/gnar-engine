/**
 * Gnar Engine Service Config
 */
export const config = {
    // service name
    serviceName: 'mcpService',

    // environment
    environment: process.env.MCP_NODE_ENV || 'development',
    runTests: process.env.MCP_RUN_TESTS || false,

    // microservice | modular-monolith
    architecture: process.env.GLOBAL_ARCHITECTURE || 'microservice',

    // web server
    http: {
        allowedOrigins: [],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Mcp-Session-Id', 'MCP-Protocol-Version', 'Last-Event-ID'],
        // the OAuth token endpoint receives form encoded bodies
        contentTypeParsers: [
            {
                contentType: 'application/x-www-form-urlencoded',
                parseAs: 'string',
                parseFunction: (request, body, done) => done(null, Object.fromEntries(new URLSearchParams(body)))
            }
        ],
        rateLimiting: {
			max: 120,
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

    // MCP server
    mcp: {
        serverName: 'gnar-engine',
        serverVersion: '1.0.0',
        instructions: 'Tools execute Gnar Engine service commands. Resources expose the JSON schemas registered by each service.',

        // supported MCP protocol versions, latest first
        protocolVersions: ['2025-11-25', '2025-06-18', '2025-03-26'],

        // respond with a single-event SSE stream (when the client accepts it) instead of application/json
        sseResponses: process.env.MCP_SSE_RESPONSES === 'true',

        // how long to cache tools & resources built from service manifests (ms)
        manifestCacheTtl: 30000,

        // default tool command timeout (ms)
        toolTimeout: 10000,

        // uri prefix for schema resources
        schemaResourceUriPrefix: 'gnar://schemas/',

        // OAuth authorization server for MCP clients
        oauth: {
            publicUrl: process.env.MCP_PUBLIC_URL,
            portalUrl: process.env.MCP_PORTAL_URL,
            scopes: ['mcp'],
            transactionTtl: 600,          // seconds a sign-in may take
            codeTtl: 60,                  // seconds an authorisation code is valid
            tokenTtl: 86400,              // seconds an mcpAuthToken is valid (one day)
            clientMetadataTimeout: 5000,  // ms to fetch a CIMD document
            clientMetadataMaxBytes: 5120  // largest CIMD document accepted
        },

        // JSON-RPC error codes
        errorCodes: {
            parseError: -32700,
            invalidRequest: -32600,
            methodNotFound: -32601,
            invalidParams: -32602,
            internalError: -32603,
            resourceNotFound: -32002
        }
    },

    hashNameSpace: '',
}
