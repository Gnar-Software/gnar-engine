import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    logger.info('Creating table: stored_notifications');

    await db.query(`
        CREATE TABLE IF NOT EXISTS stored_notifications (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            notification_id CHAR(36) NOT NULL,

            content JSON NOT NULL,
            status ENUM('unread', 'read', 'archived') DEFAULT 'unread',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            updated_by_user CHAR(36),

            FOREIGN KEY (notification_id) REFERENCES notifications(id)
                ON DELETE CASCADE
        )
    `);
};

/**
 * Down
 */
export const down = async () => {
    logger.info('Dropping table: stored_notifications');
    await db.query('DROP TABLE IF EXISTS stored_notifications');
};
