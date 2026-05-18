import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    logger.info('Creating table: email_notifications');

    await db.query(`
        CREATE TABLE IF NOT EXISTS email_notifications (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            notification_id CHAR(36) NOT NULL,

            email_address JSON NOT NULL,
            cc_email_addresses JSON DEFAULT NULL,
            bcc_email_addresses JSON DEFAULT NULL,

            from_email VARCHAR(255) NOT NULL,
            subject_line VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,

            template_id CHAR(36),
            template_slug VARCHAR(255),

            status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
            sent_at TIMESTAMP NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            updated_by_user CHAR(36),

            FOREIGN KEY (notification_id) REFERENCES notifications(id)
                ON DELETE CASCADE,
            
            FOREIGN KEY (template_id) REFERENCES notification_templates(id)
                ON DELETE SET NULL
        )
    `);
};

/**
 * Down
 */
export const down = async () => {
    logger.info('Dropping table: email_notification');
    await db.query('DROP TABLE IF EXISTS email_notifications');
};
