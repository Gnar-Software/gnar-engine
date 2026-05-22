import { db, utils } from '@gnar-engine/core';

const toCamel = row => row ? db.sql.helpers.objectToCamelCase(row) : null;

export const notification = {
    async getById({ id }) {
        const [rows] = await db.execute('SELECT * FROM notifications WHERE id = ?', [id]);
        return toCamel(rows[0]);
    },

    async getAllByUserId({ userId, pageSize = 100, pageNum = 1 } = {}) {
        pageSize = Math.max(1, Number(pageSize));
        pageNum = Math.max(1, Number(pageNum));
        const offset = (pageNum - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT * FROM notifications WHERE user_id = ? LIMIT ${pageSize} OFFSET ${offset}`,
            [userId]
        );

        const [[{ total }]] = await db.execute(
            'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?',
            [userId]
        );

        return {
            data: rows.map(toCamel),
            pagination: { pageSize, pageNum, total }
        };
    },

    async getAll({ pageSize = 100, pageNum = 1 } = {}) {
        pageSize = Math.max(1, Number(pageSize));
        pageNum = Math.max(1, Number(pageNum));
        const offset = (pageNum - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT * FROM notifications LIMIT ${pageSize} OFFSET ${offset}`
        );

        const [[{ total }]] = await db.execute(
            'SELECT COUNT(*) AS total FROM notifications'
        );

        return {
            data: rows.map(toCamel),
            pagination: { pageSize, pageNum, total }
        };
    },

    async getByType({ userId, type, pageSize = 100, pageNum = 1 } = {}) {
        pageSize = Math.max(1, Number(pageSize));
        pageNum = Math.max(1, Number(pageNum));
        const offset = (pageNum - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT * FROM notifications WHERE user_id = ? AND type = ? LIMIT ${pageSize} OFFSET ${offset}`,
            [userId, type]
        );

        const [[{ total }]] = await db.execute(
            'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND type = ?',
            [userId, type]
        );

        return {
            data: rows.map(toCamel),
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

        const columns = Object.keys(data).map(db.sql.helpers.toSnake);
        const assignments = columns.map(col => `${col} = ?`);
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

    async checkIdempotent({ idempotencyKey }) {
        if (!idempotencyKey) {
            return true;
        }

        const [rows] = await db.execute(
            'SELECT id FROM notifications WHERE idempotency_key = ?',
            [idempotencyKey]
        );

        return rows.length === 0;
    }
};
