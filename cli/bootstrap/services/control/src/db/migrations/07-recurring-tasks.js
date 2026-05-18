import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    logger.info('Creating table: recurring_tasks');
    await db.query(`
        CREATE TABLE recurring_tasks (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            payload JSON NOT NULL,
            handler VARCHAR(255) NOT NULL,
            starts_at TIMESTAMP NOT NULL,
            ends_at TIMESTAMP NULL DEFAULT NULL,
            cron_expression VARCHAR(255) NOT NULL,
            next_run_at TIMESTAMP NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'active',
            type VARCHAR(64) NOT NULL DEFAULT '',
            idempotency_key VARCHAR(255) NULL,
            reschedule_centrally_on_failure TINYINT(1) DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            INDEX idx_recurring_next_run (status, next_run_at),
            UNIQUE KEY uniq_idempotency (idempotency_key)
        )
    `);
}

/**
 * Down
 */
export const down = async () => {
    logger.info('Dropping table: recurring_tasks');
    await db.query('DROP TABLE IF EXISTS recurring_tasks');
}
