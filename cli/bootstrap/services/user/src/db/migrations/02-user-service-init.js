import { logger, db } from '@gnar-engine/core';
import { config } from '../../config.js';


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

    // create users table
    logger.info('Creating users table');
    const createUserTableQuery = `
        CREATE TABLE users (
            id CHAR(36) PRIMARY KEY,
            username VARCHAR(255),
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255),
            api_key VARCHAR(255),
            role ENUM(${config.userRoles.map(role => `'${role}'`).join(',')}) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    await db.query(createUserTableQuery, [config.userRoles.join(',')]);

    // create sessions table
    logger.info('Creating sessions table');
    const createSessionsTableQuery = `
        CREATE TABLE sessions (
            token VARCHAR(255) PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP GENERATED ALWAYS AS (created_at + INTERVAL 1 HOUR) VIRTUAL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    await db.query(createSessionsTableQuery);
}

/**
 * Drop all tables
 */
export const dropDatabaseTables = async () => {
    logger.info('Dropping tables');
    await db.query('DROP TABLE IF EXISTS sessions');
    await db.query('DROP TABLE IF EXISTS users');
}
