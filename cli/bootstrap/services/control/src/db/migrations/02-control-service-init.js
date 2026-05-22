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

    // Recurring tasks table
    logger.info('Creating recurring tasks table');
    const createRecurringTasksTableQuery = `
        CREATE TABLE recurring_tasks (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            payload JSON NOT NULL,
            handler VARCHAR(255) NOT NULL,
            starts_at TIMESTAMP NOT NULL,
            ends_at TIMESTAMP NULL DEFAULT NULL,
            cron_expression VARCHAR(255) NOT NULL,
            next_run_at TIMESTAMP NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'active',
            type VARCHAR(64) NOT NULL DEFAULT '',
            idempotency_key VARCHAR(255) NULL,
            reschedule_centrally_on_failure TINYINT(1) DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            INDEX idx_recurring_next_run (status, next_run_at),
            UNIQUE KEY uniq_idempotency (idempotency_key)
        )`;
    await db.query(createRecurringTasksTableQuery);
}

/**
 * Drop all tables
 */
export const dropDatabaseTables = async () => {
    logger.info('Dropping tables');
    await db.query('DROP TABLE IF EXISTS recurring_tasks');
    await db.query('DROP TABLE IF EXISTS peer_connections');
    await db.query('DROP TABLE IF EXISTS service_replicas');
    await db.query('DROP TABLE IF EXISTS tasks');
    await db.query('DROP TABLE IF EXISTS service_registry');
}
