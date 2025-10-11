import { MongoClient } from 'mongodb';
import mysql from 'mysql2/promise';
import { loggerService } from './../services/logger.service.js';

/**
 * @function initDbConnection
 * @description Establishes a connection to the MongoDB database and reuses it for subsequent requests.
 * @returns {Promise<MongoClient>} The MongoDB client.
 */
export let db = null;

const retryInterval = 5000;

export const initDbConnection = async (config) => {
    if (db) {
        return db;
    }

    try {
        switch (config.type) {
            case 'mongodb':
                return await initMongoDbConnection({
                    connectionUrl: config.connectionUrl,
                    connectionArgs: config.connectionArgs
                });

            case 'mysql':
                return await initMysqlConnection({
                    host: config.host,
                    user: config.user,
                    password: config.password,
                    database: config.database,
                    connectionLimit: config.connectionLimit,
                    queueLimit: config.queueLimit
                });
                
            default:
                throw new Error('Unsupported database type: ' + config.type);
        }
    } catch (error) {
        loggerService.error('Error initializing database connection: ' + error.message);
        throw error;
    }
}

/**
 * Initialises a connection to MongoDB.
 * 
 * @param {Object} config - MongoDB connection configuration.
 * @param {string} connectionUrl - The MongoDB connection URL.
 * @param {Object} [connectionArgs={}] - Additional connection options.
 * @returns {Promise<MongoClient>} The MongoDB client.
 */
const initMongoDbConnection = async ({connectionUrl, connectionArgs = {}}) => {
    try {
        loggerService.info('Connecting to mongo.. ');
        const dbClient = await MongoClient.connect(connectionUrl, connectionArgs);
        db = dbClient.db();

        loggerService.info('MongoDB connected successfully');
        return db;
    } catch (err) {
        loggerService.error('MongoDB connection error: ' + err);
        throw err;
    }
}

/**
 * Initialises a connection to MySQL.
 * 
 * @param {object} config - MySQL connection configuration.
 * @param {string} config.host - MySQL host.
 * @param {string} config.user - MySQL user.
 * @param {string} config.password - MySQL password.
 * @param {string} config.database - MySQL database name.
 * @param {number} [config.connectionLimit=10] - Maximum number of connections in the pool.
 * @param {number} [config.queueLimit=20] - Maximum number of queued connection requests.
 * @returns {Promise<mysql.Pool>} The MySQL connection pool.
 */
const initMysqlConnection = async ({host, user, password, database, connectionLimit = 10, queueLimit = 20, maxRetries = 5}) => {
    if (db) return db;

    let retries = 0;

    while (retries < maxRetries) {
        try {
            await assertDbExists({
                host,
                user,
                password,
                database
            });

            loggerService.info('Establishing new MySQL pool...');
            db = await mysql.createPool({
                host: host,
                user: user,
                password: password,
                database: database,
                waitForConnections: true,
                connectionLimit: connectionLimit,
                queueLimit: queueLimit
            });

            loggerService.info('MySQL pool established successfully');
            return db;

        } catch (error) {
            loggerService.error(`MySQL connection attempt ${retries + 1} failed: ${error.message}`);
            retries++;

            if  (retries >= maxRetries) {
                loggerService.error('Max retries reached. Could not connect to MySQL.');
                throw new Error('Could not connect to the database after multiple attempts');
            }

            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    }
}

/**
 * Assert SQL database exists before connecting
 *  
 * @description Ensures the target database exists before creating a connection pool.
 * 
 * @param {Object} config - Configuration object.
 * @param {string} config.host - MySQL host.
 * @param {string} config.user - MySQL user.
 * @param {string} config.password - MySQL password.
 * @param {string} config.database - MySQL database name.
 * @returns {Promise<void>}
 */
const assertDbExists = async ({host, user, password, database}) => {
    loggerService.info(`[assertDbExists] Attempting to connect to MySQL on host ${host} as ${user}`);
    loggerService.info(`[assertDbExists] Target DB: ${database}`);

    // Validate inputs
    if (!database || !host || !user || !password) {
        loggerService.error('[assertDbExists] Missing required variables: database, host, user, or password');
        throw new Error('Missing required variables for DB connection');
    }

    try {
        const connection = await mysql.createConnection({ host, user, password });

        loggerService.info(`[assertDbExists] Connected to MySQL, asserting database '${database}'`);
        const [result] = await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await connection.end();
    } catch (error) {
        loggerService.error('[assertDbExists] ❌ Error asserting database existence');
        loggerService.error(error.stack || error.message || error);
        throw error;
    }
};

/**
 * Check connection (healtcheck)
 */
export const checkConnection = async () => {
    if (!db) {
        throw new Error('Database connection not initialized');
    }

    try {
        //await db.command({ ping: 1 });
        return true;
    } catch (error) {
        throw error;
    }
}