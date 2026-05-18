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

    // Service replicas table
    logger.info('Creating service replicas table');
    const createServiceReplicasTableQuery = `
        CREATE TABLE service_replicas (
            replica_hostname VARCHAR(255) PRIMARY KEY,
            service_name VARCHAR(255) NOT NULL,
            replica_slot VARCHAR(255) NOT NULL,
            replica_ip VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`;
    await db.query(createServiceReplicasTableQuery);
}

/**
 * Drop all tables
 */
export const dropDatabaseTables = async () => {
    logger.info('Dropping tables');
    await db.query('DROP TABLE IF EXISTS service_replicas');
}
