import { logger, db } from '@gnar-engine/core';

export const up = async () => {
    logger.info('Creating password_resets table');

    await db.query(`
        CREATE TABLE IF NOT EXISTS password_resets (
            token VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP GENERATED ALWAYS AS (created_at + INTERVAL 21 DAY) VIRTUAL
        )
    `);
};

export const down = async () => {
    logger.info('Dropping password_resets table');
    await db.query('DROP TABLE IF EXISTS password_resets');
};
