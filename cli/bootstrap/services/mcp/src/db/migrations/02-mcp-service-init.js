import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    logger.info('Creating table: mcps');
    await db.query(`
        CREATE TABLE mcps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
}

/**
 * Down
 */
export const down = async () => {
    logger.info('Dropping table: mcps');
    await db.query('DROP TABLE IF EXISTS mcps');
}
