import { db, utils, error } from '@gnar-engine/core';
import { createHash } from 'node:crypto';
import { config } from '../config.js';

/**
 * The child record for a notification of type 'email'. Holds the address, the
 * subject, the compiled body and where the sending got to.
 */
export const emailNotification = {

    /**
     * A key for one email: who it goes to, what it says, and which window of the
     * clock it was raised in. The same email raised twice inside the window
     * lands on the same key and the second one is dropped, so a reader who
     * clicks submit twice is sent one email rather than two.
     *
     * The prefix separates the keys of two emails raised from the same source:
     * an enquiry and its acknowledgement carry the same address and words but
     * are not the same email.
     */
    idempotencyKeyFor({ prefix, emailAddress, message }) {
        const bucket = Math.floor(Date.now() / config.idempotencyWindowMs);
        const digest = createHash('sha256')
            .update(`${emailAddress}|${message}|${bucket}`)
            .digest('hex')
            .slice(0, 40);

        return `${prefix}:${digest}`;
    },

    async getById({ id }) {
        const [rows] = await db.execute('SELECT * FROM email_notifications WHERE id = ?', [id]);
        return rows[0] ? db.sql.helpers.objectToCamelCase(rows[0]) : null;
    },

    async getAll({ pageSize = 100, pageNum = 1 } = {}) {
        // A page is interpolated into the query rather than bound, so anything
        // that is not a whole number is refused here. A query string carries
        // digits as text, so '2' is a page and 'abc' is a bad request.
        pageSize = Number(pageSize);
        pageNum = Number(pageNum);

        if (!Number.isInteger(pageSize) || pageSize < 1) {
            throw new error.badRequest('pageSize must be a whole number of at least 1');
        }

        if (!Number.isInteger(pageNum) || pageNum < 1) {
            throw new error.badRequest('pageNum must be a whole number of at least 1');
        }

        const offset = (pageNum - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`
        );

        const [[{ total }]] = await db.execute('SELECT COUNT(*) AS total FROM email_notifications');

        return {
            data: rows.map(row => db.sql.helpers.objectToCamelCase(row)),
            pagination: { pageSize, pageNum, total }
        };
    },

    async getLatestByNotificationId({ notificationId }) {
        const [rows] = await db.execute(
            `SELECT * FROM email_notifications
             WHERE notification_id = ?
             ORDER BY created_at DESC
             LIMIT 1`,
            [notificationId]
        );

        return rows[0] ? db.sql.helpers.objectToCamelCase(rows[0]) : null;
    },

    async create({ data }) {
        const id = utils.uuid();

        const columns = ['id', ...Object.keys(data).map(db.sql.helpers.toSnake)];
        const placeholders = columns.map(() => '?');

        // The two address lists and the template data are json columns, so they
        // go in as text rather than as an object mysql cannot bind
        const values = [
            id,
            ...Object.values(data).map(value => (
                value !== null && typeof value === 'object' ? JSON.stringify(value) : value
            ))
        ];

        await db.execute(
            `INSERT INTO email_notifications (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
            values
        );

        return await this.getById({ id });
    },

    async update({ id, data }) {
        if (Object.keys(data).length === 0) {
            return await this.getById({ id });
        }

        const assignments = Object.keys(data).map(key => `${db.sql.helpers.toSnake(key)} = ?`);
        const values = Object.values(data).map(value => (
            value !== null && typeof value === 'object' ? JSON.stringify(value) : value
        ));

        await db.execute(
            `UPDATE email_notifications SET ${assignments.join(', ')} WHERE id = ?`,
            [...values, id]
        );

        return await this.getById({ id });
    },

    async delete({ id }) {
        await db.execute('DELETE FROM email_notifications WHERE id = ?', [id]);
        return true;
    },

    async markSent({ id }) {
        await db.execute(
            `UPDATE email_notifications
             SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [id]
        );

        return await this.getById({ id });
    },

    async markFailed({ id }) {
        await db.execute(
            `UPDATE email_notifications
             SET status = 'failed', updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [id]
        );

        return await this.getById({ id });
    },
};
