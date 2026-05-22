import { db, utils } from '@gnar-engine/core';

export const storedNotification = {
    async getById({ id }) {
        const [rows] = await db.execute('SELECT * FROM stored_notifications WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async getAll({ pageSize = 100, pageNum = 1 } = {}) {
        pageSize = Math.max(1, Number(pageSize));
        pageNum = Math.max(1, Number(pageNum));
        const offset = (pageNum - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT * FROM stored_notifications LIMIT ${pageSize} OFFSET ${offset}`
        );

        const [[{ total }]] = await db.execute(
            'SELECT COUNT(*) AS total FROM stored_notifications'
        );

        return {
            data: rows,
            pagination: { pageSize, pageNum, total }
        };
    },

    async getByUserId({ userId, pageSize = 100, pageNum = 1 } = {}) {
        pageSize = Math.max(1, Number(pageSize));
        pageNum = Math.max(1, Number(pageNum));
        const offset = (pageNum - 1) * pageSize;

        const [rows] = await db.execute(`
            SELECT
                stored_notifications.*,
                p.user_id AS user_id
            FROM
                stored_notifications
            JOIN
                notifications AS p ON stored_notifications.notification_id = p.id
            WHERE
                p.user_id = ?
            LIMIT
                ${pageSize}
            OFFSET
                ${offset}
            `,
            [userId]
        );

        const [[{ total }]] = await db.execute(`
            SELECT
                COUNT(*) AS total
            FROM
                stored_notifications
            JOIN
                notifications AS p ON stored_notifications.notification_id = p.id
            WHERE
                p.user_id = ?
            `,
            [userId]
        );

        return {
            data: rows,
            pagination: { pageSize, pageNum, total }
        };
    },

    async create({ data }) {
        const id = utils.uuid();
        const columns = ['id', ...Object.keys(data).map(db.sql.helpers.toSnake)];
        const placeholders = columns.map(() => '?');
        const values = [
            id,
            ...Object.values(data).map(value => (
                value && typeof value === 'object' ? JSON.stringify(value) : value
            ))
        ];

        await db.execute(
            `INSERT INTO stored_notifications (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
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
        const values = Object.values(data).map(value => (
            value && typeof value === 'object' ? JSON.stringify(value) : value
        ));

        await db.execute(
            `UPDATE stored_notifications SET ${assignments.join(', ')} WHERE id = ?`,
            [...values, id]
        );

        return this.getById({ id });
    },

    async delete({ id }) {
        await db.execute('DELETE FROM stored_notifications WHERE id = ?', [id]);
        return true;
    }
};
