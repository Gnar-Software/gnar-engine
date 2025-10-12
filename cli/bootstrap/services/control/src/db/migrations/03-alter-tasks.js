import { logger, db } from '@gnar-engine/core';

/**
 * Up
 */
export const up = async () => {
    await alertTaskTable();
}

/**
 * Down
 */
export const down = async () => {

}

/**
 * Add new columns to task table
 */
export const alertTaskTable = async () => {
    const alterTasksTableQuery = `
        ALTER TABLE tasks
        MODIFY COLUMN recurring_interval ENUM('hourly', 'daily', 'weekly', 'monthly', 'yearly', 'none') DEFAULT 'none',
        ADD COLUMN reschedule_centrally_on_success BOOLEAN DEFAULT FALSE,
        ADD COLUMN reschedule_centrally_on_failure BOOLEAN DEFAULT FALSE,
        ADD COLUMN idempotency_key VARCHAR(255) DEFAULT NULL
    `;
    await db.query(alterTasksTableQuery);
}
