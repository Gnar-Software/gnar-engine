import { db, utils, error } from '@gnar-engine/core';

/**
 * The parent notification record. It carries the kind of notification and the
 * key that makes a repeated send safe; everything else lives in the child table
 * for that kind.
 */
export const notification = {

    async getById({ id }) {
        const [rows] = await db.execute('SELECT * FROM notifications WHERE id = ?', [id]);
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
            `SELECT * FROM notifications ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`
        );

        const [[{ total }]] = await db.execute('SELECT COUNT(*) AS total FROM notifications');

        return {
            data: rows.map(row => db.sql.helpers.objectToCamelCase(row)),
            pagination: { pageSize, pageNum, total }
        };
    },

    async create({ data }) {
        const id = utils.uuid();

        const columns = ['id', ...Object.keys(data).map(db.sql.helpers.toSnake)];
        const placeholders = columns.map(() => '?');
        const values = [id, ...Object.values(data)];

        await db.execute(
            `INSERT INTO notifications (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
            values
        );

        return await this.getById({ id });
    },

    async update({ id, data }) {
        if (Object.keys(data).length === 0) {
            return await this.getById({ id });
        }

        const assignments = Object.keys(data).map(key => `${db.sql.helpers.toSnake(key)} = ?`);
        const values = Object.values(data);

        await db.execute(
            `UPDATE notifications SET ${assignments.join(', ')} WHERE id = ?`,
            [...values, id]
        );

        return await this.getById({ id });
    },

    async delete({ id }) {
        await db.execute('DELETE FROM notifications WHERE id = ?', [id]);
        return true;
    },

    /**
     * The notification already stored under this key, or null. The row rather
     * than a yes or no: what to do about a repeat depends on what became of the
     * first one, and the caller cannot ask that of a boolean.
     */
    async getByIdempotencyKey({ idempotencyKey }) {
        if (!idempotencyKey) {
            return null;
        }

        const [rows] = await db.execute(
            'SELECT * FROM notifications WHERE idempotency_key = ?',
            [idempotencyKey]
        );

        return rows[0] ? db.sql.helpers.objectToCamelCase(rows[0]) : null;
    }
};
