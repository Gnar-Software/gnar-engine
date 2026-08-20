import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    await initDatabaseTables();
}

/**
 * Down
 */
export const down = async () => {
    await dropDatabaseTables();
}

/**
 * Create all tables
 */
export const initDatabaseTables = async () => {

    // Service peer connection table
    logger.info('Creating peer connection table');
    const createPeerConnectionsTableQuery = `
        CREATE TABLE peer_connections (
            id VARCHAR(50) PRIMARY KEY,
            service_replica_1_hostname VARCHAR(255) NOT NULL,
            service_replica_2_hostname VARCHAR(255) NOT NULL,
            peer_low VARCHAR(255) AS (LEAST(service_replica_1_hostname, service_replica_2_hostname)) STORED,
            peer_high VARCHAR(255) AS (GREATEST(service_replica_1_hostname, service_replica_2_hostname)) STORED,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_peer_pair (peer_low, peer_high)
        )`;
    await db.query(createPeerConnectionsTableQuery);
}

/**
 * Drop all tables
 */
export const dropDatabaseTables = async () => {
    logger.info('Dropping tables');
    await db.query('DROP TABLE IF EXISTS peer_connections');
}
