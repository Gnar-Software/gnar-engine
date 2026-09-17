import { logger, db } from '@gnar-engine/core';

/**
 * Up
 *
 * The notifications table was created with an id and its timestamps alone. A
 * notification needs to say what kind it is, so the child table holding the
 * rest of it can be found, and it needs a key the sender can repeat safely.
 */
export const up = async () => {
    logger.info('Adding type, user_id and idempotency_key to notifications');

    await db.query(`
        ALTER TABLE notifications
            ADD COLUMN type ENUM('email') NULL,
            ADD COLUMN user_id CHAR(36) NULL,
            ADD COLUMN idempotency_key VARCHAR(100) NULL
    `);

    await db.query(`
        ALTER TABLE notifications
            ADD UNIQUE KEY uq_notification_idempotency_key (idempotency_key)
    `);
}

/**
 * Down
 */
export const down = async () => {
    logger.info('Removing type, user_id and idempotency_key from notifications');

    await db.query('ALTER TABLE notifications DROP INDEX uq_notification_idempotency_key');
    await db.query(`
        ALTER TABLE notifications
            DROP COLUMN type,
            DROP COLUMN user_id,
            DROP COLUMN idempotency_key
    `);
}
