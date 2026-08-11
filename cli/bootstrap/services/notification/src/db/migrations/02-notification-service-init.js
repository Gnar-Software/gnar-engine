import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    logger.info('Creating table: notifications');
    await db.query(`
        CREATE TABLE notifications (
            id CHAR(36) PRIMARY KEY,
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
