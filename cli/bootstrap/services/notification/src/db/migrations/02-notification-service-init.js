import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    logger.info('Creating table: notifications');
    await db.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            type ENUM('email', 'stored'),

            user_id CHAR(36),
            archived BOOLEAN DEFAULT FALSE,
            idempotency_key VARCHAR(100) NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
}

/**
 * Down
 */
export const down = async () => {
    logger.info('Dropping table: notifications');
    await db.query('DROP TABLE IF EXISTS notifications');
}
