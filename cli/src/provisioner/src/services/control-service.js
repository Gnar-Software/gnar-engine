
import mysql from 'mysql2/promise';

const retryInterval = 5000;
const maxRetries = 5;
const runtimeTables = {
    service_replicas: 'service replicas',
    peer_connections: 'service connections'
};

let db;

const assertInitialised = () => {
    if (!db) {
        throw new Error('Control service database connection not initialized. Cannot flush old replicas and connections.');
    }
}

const tableExists = async (tableName) => {
    const [rows] = await db.query(
        `
            SELECT TABLE_NAME
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
            LIMIT 1
        `,
        [tableName]
    );

    return rows.length > 0;
}

const flushRuntimeTable = async (tableName) => {
    assertInitialised();

    if (!Object.hasOwn(runtimeTables, tableName)) {
        throw new Error(`Unsupported runtime table cleanup requested: ${tableName}`);
    }

    if (!await tableExists(tableName)) {
        console.log(`Skipping old ${runtimeTables[tableName]} cleanup; ${tableName} table does not exist yet.`);
        return;
    }

    await db.query(`DELETE FROM \`${tableName}\`;`);
    console.log(`Flushed old ${runtimeTables[tableName]} from control service database.`);
}

export const controlService = {

    init: async ({ host, database, user, password }) => {
        // connect to db
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const conn = await mysql.createConnection({
                    host: host || 'db-mysql',
                    user: user,
                    password: password,
                    database: database
                });

                db = conn;
                return;

            } catch (error) {
                console.log('Waiting for MySQL to be ready...');
                retries++;

                if (retries >= maxRetries) {
                    throw new Error('Max retries reached. Could not connect to control service database.');
                }

                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        }
    },

    flushOldReplicas: async () => {
        try {
            await flushRuntimeTable('service_replicas');
        } catch (error) {
            throw new Error(`Error flushing old service replicas: ${error.message}`);
        }
    },

    flushOldConnections: async () => {
        try {
            await flushRuntimeTable('peer_connections');
        } catch (error) {
            throw new Error(`Error flushing old service connections: ${error.message}`);
        }
    },

    close: async () => {
        if (!db) {
            return;
        }

        await db.end();
        db = null;
    }
}
