import { logger, db } from '@gnar-engine/core';

export const up = async () => {
    logger.info('Adding idempotency_key column to notifications table');

    const [columns] = await db.query("SHOW COLUMNS FROM notifications LIKE 'idempotency_key'");

    if (columns.length) {
        logger.info('idempotency_key column already exists on notifications table');
        return;
    }

    await db.query(`
        ALTER TABLE notifications
        ADD COLUMN idempotency_key VARCHAR(100) NULL
    `);
};

export const down = async () => {};
