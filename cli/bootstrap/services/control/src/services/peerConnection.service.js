import { db, utils, logger } from '@gnar-engine/core';


/**
 * Registry Service
 */
export const peerConnection = {

    // get all peer connections
    getAll: async () => {
        try {
            const [result] = await db.execute(
                'SELECT * FROM `peer_connections`'
            );

            return result.map(row => db.sql.helpers.objectToCamelCase(row)) || [];
        } catch (error) {
            logger.error("Error getting peer connections: " + error);
            throw error;
        }
    },

    // get by replica hostname
    get: async ({ replicaHostname }) => {
        try {
            const [result] = await db.execute(
                'SELECT * FROM `peer_connections` WHERE service_replica_1_hostname = ? OR service_replica_2_hostname = ?',
                [replicaHostname, replicaHostname]
            );

            return result.map(row => db.sql.helpers.objectToCamelCase(row)) || [];
        } catch (error) {
            logger.error("Error getting peer connections for replica: " + error);
            throw error;
        }
    },

    // add new peer connection
    add: async ({ replicaHostname1, replicaHostname2 }) => {
        try {
            const id = utils.uuid();
            try {
                const [result] = await db.execute(
                    'INSERT INTO `peer_connections` (`id`, `service_replica_1_hostname`, `service_replica_2_hostname`) VALUES (?, ?, ?)',
                    [id, replicaHostname1, replicaHostname2]
                );
            } catch (error) {
                logger.error("Error inserting peer connection - could be duplicate entry: " + error);
                throw error;
            }

            return id;
        } catch (error) {
            logger.error("Error adding peer connection: " + error);
            throw error;
        }
    },

    // remove
    remove: async ({ replicaHostname1, replicaHostname2 }) => {
        try {
            const [result] = await db.execute(
                'DELETE FROM `peer_connections` WHERE (service_replica_1_hostname = ? AND service_replica_2_hostname = ?) OR (service_replica_1_hostname = ? AND service_replica_2_hostname = ?)',
                [replicaHostname1, replicaHostname2, replicaHostname2, replicaHostname1]
            );
        } catch (error) {
            logger.error("Error removing peer connection: " + error);
            throw error;
        }
    },

    // remove all for replica
    removeAllForReplica: async ({ replicaHostname }) => {
        try {
            const [result] = await db.execute(
                'DELETE FROM `peer_connections` WHERE service_replica_1_hostname = ? OR service_replica_2_hostname = ?',
                [replicaHostname, replicaHostname]
            );

            return result.affectedRows;
        } catch (error) {
            logger.error("Error removing peer connections for replica: " + error);
            throw error;
        }
    }
}
