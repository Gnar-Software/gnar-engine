import { logger, db } from '@gnar-engine/core';

/**
 * Up
 *
 * One OAuth sign-in, from /authorize until the authorisation code is exchanged for a token.
 */
export const up = async () => {
    logger.info('Creating table: oauth_transactions');

    await db.query(`
        CREATE TABLE oauth_transactions (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            client_id VARCHAR(2048) NOT NULL,
            client_name VARCHAR(255) NOT NULL,
            redirect_uri VARCHAR(2048) NOT NULL,
            state VARCHAR(1024) NULL,
            code_challenge VARCHAR(128) NOT NULL,
            scope VARCHAR(255) NOT NULL,
            user_id CHAR(36) NULL,
            code_hash CHAR(64) NULL UNIQUE,
            code_expires_at TIMESTAMP NULL,
            code_used_at TIMESTAMP NULL,
            completed_at TIMESTAMP NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
}

/**
 * Down
 */
export const down = async () => {
    logger.info('Dropping table: oauth_transactions');
    await db.query('DROP TABLE IF EXISTS oauth_transactions');
}
