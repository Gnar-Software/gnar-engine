import { logger, db } from '@gnar-engine/core';

export const up = async () => {
    logger.info('Creating table: email_notifications');

    await db.query(`
        CREATE TABLE IF NOT EXISTS email_notifications (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            notification_id CHAR(36) NOT NULL,
            email_address VARCHAR(255) NOT NULL,
            cc_email_addresses JSON DEFAULT NULL,
            bcc_email_addresses JSON DEFAULT NULL,
            from_email VARCHAR(255) NOT NULL,
            subject_line VARCHAR(255) NOT NULL,
            content TEXT NULL,
            template_slug VARCHAR(255) NULL,
            template_data JSON DEFAULT NULL,
            status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
            sent_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            updated_by_user CHAR(36) NULL,
            UNIQUE KEY uq_email_notification_parent (notification_id),
            FOREIGN KEY (notification_id) REFERENCES notifications(id)
                ON DELETE CASCADE
        )
    `);
};

export const down = async () => {
    logger.info('Dropping table: email_notifications');
    await db.query('DROP TABLE IF EXISTS email_notifications');
};
