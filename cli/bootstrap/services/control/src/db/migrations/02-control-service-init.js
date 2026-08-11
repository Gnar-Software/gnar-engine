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

    // Tasks table
    logger.info('Creating tasks table');
    const createTasksTableQuery = `
        CREATE TABLE tasks (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            payload JSON NOT NULL,
            status VARCHAR(255) DEFAULT 'scheduled',
            scheduled TIMESTAMP NOT NULL,
            recurring_interval ENUM('hourly', 'daily', 'weekly', 'monthly', 'yearly') DEFAULT NULL,
            recurring_interval_count INT DEFAULT 0,
            handler VARCHAR(255) NOT NULL,
            retry_attempts INT DEFAULT 0,
            recurring_task_id CHAR(36) NULL,
            reschedule_centrally_on_failure TINYINT(1) DEFAULT TRUE,
            idempotency_key VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`;
    await db.query(createTasksTableQuery);

    // Service registry table
    logger.info('Creating service registry table');
    const createServiceRegistryTableQuery = `
        CREATE TABLE service_registry (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            manifest JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`;
    await db.query(createServiceRegistryTableQuery);
}

/**
 * Drop all tables
 */
export const dropDatabaseTables = async () => {
    logger.info('Dropping tables');
    await db.query('DROP TABLE IF EXISTS tasks');
    await db.query('DROP TABLE IF EXISTS service_registry');
}
