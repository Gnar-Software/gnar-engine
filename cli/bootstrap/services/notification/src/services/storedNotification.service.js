import { db, utils } from '@gnar-engine/core';

export const storedNotification = {
    async getById({ id }) {
        const [result] = await db.execute('SELECT * FROM stored_notifications WHERE id = ?', [id]);
        return result[0] || null;
    },

    async getAll({ pageSize = 100, pageNum = 1 } = {}) {
        const currPageSize = Math.max(1, Number(pageSize));
        const currPageNum = Math.max(1, Number(pageNum));
        const offset = (currPageNum - 1) * currPageSize;

        const [rows] = await db.execute(
            `SELECT * FROM stored_notifications LIMIT ${currPageSize} OFFSET ${offset}`
        );

        const [[{ total }]] = await db.execute(
            'SELECT COUNT(*) AS total FROM stored_notifications'
        );

        return {
            // data: rows.map(row => db.sql.helpers.objectToCamelCase(row)),
            data: rows,
            pagination: {
                pageSize: currPageSize,
                pageNum: currPageNum,
                total
            }
        }
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
                user_id = ? 
            LIMIT 
                ${pageSize} 
            OFFSET 
                ${offset}`,
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
                user_id = ?`,
            [userId]
        );

        return {
            data: rows,
            pagination: {
                pageSize,
                pageNum,
                total
            }
        };
    },

    async create({ data }) {
        // Generate a unique ID for the notification
        const id = utils.uuid();

        const columns = ['id', ...Object.keys(data).map(db.sql.helpers.toSnake)];
        const placeholders = columns.map(() => '?');
        const values = [id, ...Object.values(data)];

        const sql = `INSERT INTO stored_notifications (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        const dbResponse = await db.execute(sql, values);
        const { insertId } = dbResponse[0];

        return await this.getById({ id });
    },

    async update({ id, data }) {
        // If data is empty, return the existing notification
        if (Object.keys(data).length === 0) {
            return await this.getById({ id });
        }
        const columns = Object.keys(data).map((key) => db.sql.helpers.toSnake(key));
        const assignments = columns.map(col => `${col} = ?`);
        const values = Object.values(data);

        const sql = `UPDATE stored_notifications SET ${assignments.join(', ')} WHERE id = ?`;

        await db.query(sql, [...values, id]);
        return this.getById({ id });
    },

    async delete({ id }) {
        await db.execute('DELETE FROM stored_notifications WHERE id = ?', [id]);
        return true;
    },
};
