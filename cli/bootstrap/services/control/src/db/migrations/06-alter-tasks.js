import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    await db.query(`
        ALTER TABLE tasks
            ADD COLUMN handler VARCHAR(255) NOT NULL,
            ADD COLUMN retry_attempts INT DEFAULT 0,
            ADD COLUMN recurring_task_id CHAR(36) NULL,

            MODIFY COLUMN payload JSON NOT NULL,
            MODIFY COLUMN status VARCHAR(255) DEFAULT 'scheduled',
            MODIFY COLUMN recurring_interval ENUM('hourly', 'daily', 'weekly', 'monthly', 'yearly') DEFAULT NULL,
            MODIFY COLUMN recurring_interval_count INT DEFAULT 0,
            MODIFY COLUMN scheduled TIMESTAMP NOT NULL,
            MODIFY COLUMN reschedule_centrally_on_failure TINYINT(1) DEFAULT TRUE,
            MODIFY COLUMN idempotency_key VARCHAR(255) DEFAULT NULL,

            DROP COLUMN handler_service_name,
            DROP COLUMN handler_name,
            DROP COLUMN reschedule_centrally_on_success;
    `);
};

/**
 * Down
 */
export const down = async () => {
    await db.query(`
        ALTER TABLE tasks
            ADD COLUMN handler_service_name VARCHAR(255),
            ADD COLUMN handler_name VARCHAR(255),
            ADD COLUMN reschedule_centrally_on_success TINYINT(1) DEFAULT FALSE,

            DROP COLUMN recurring_task_id,
            DROP COLUMN handler,
            DROP COLUMN retry_attempts;
    `);
};
