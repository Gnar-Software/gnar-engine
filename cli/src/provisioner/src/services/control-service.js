
import mysql from 'mysql2/promise';

const retryInterval = 5000;
const maxRetries = 5;

let db;

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
        if (!db) {
            throw new Error('Control service database connection not initialized. Cannot flush old replicas and connections.');
        }

        try {
            // if (!await db.query(`SHOW TABLES LIKE 'service_replicas';`)) {
            //     return;
            // }

            await db.query(`DELETE FROM service_replicas;`)
            console.log('Flushed old service replicas from control service database.');
        } catch (error) {
            //throw new Error(`Error flushing old service replicas: ${error.message}`);
        }
    },

    flushOldConnections: async () => {
        if (!db) {
            throw new Error('Control service database connection not initialized. Cannot flush old replicas and connections.');
        }

        try {
            // if (!await db.query(`SHOW TABLES LIKE 'peer_connections';`)) {
            //     return;
            // }

            await db.query(`DELETE FROM peer_connections;`)
            console.log('Flushed old service connections from control service database.');
        } catch (error) {
            //throw new Error(`Error flushing old service connections: ${error.message}`);
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
