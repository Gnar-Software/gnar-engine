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
 * Create tables
 * 
 * @param {*} db 
 */
export const initDatabaseTables = async () => {

    // create unauth sessions table
    logger.info('Creating password_resets table');
    const createUnauthSessionsTableQuery = `
        CREATE TABLE password_resets (
            token VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP GENERATED ALWAYS AS (created_at + INTERVAL 1 DAY) VIRTUAL
        )
    `;
    await db.query(createUnauthSessionsTableQuery);
}

/**
 * Drop all tables
 */
export const dropDatabaseTables = async () => {
    logger.info('Dropping tables');
    await db.query('DROP TABLE IF EXISTS password_resets');
}