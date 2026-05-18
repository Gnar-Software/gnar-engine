import { db, utils, commands } from '@gnar-engine/core';

export const emailNotification = {
    async getById({ id }) {
        const [result] = await db.execute('SELECT * FROM email_notifications WHERE id = ?', [id]);
        return result[0] || null;
    },

    async getAll({ pageSize = 100, pageNum = 1 } = {}) {
        pageSize = Math.max(1, Number(pageSize));
        pageNum = Math.max(1, Number(pageNum));
        const offset = (pageNum - 1) * pageSize;

        const [rows] = await db.execute(
            `SELECT * FROM email_notifications LIMIT ${pageSize} OFFSET ${offset}`,
            []
        );

        const [[{ total }]] = await db.execute(
            'SELECT COUNT(*) AS total FROM email_notifications'
        );

        return {
            // data: rows.map(row => db.sql.helpers.objectToCamelCase(row)),
            data: rows,
            pagination: {
                pageSize,
                pageNum,
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
                email_notifications.*,
                p.user_id AS user_id
            FROM 
                email_notifications 
            LEFT JOIN 
                notifications AS p ON p.id = email_notifications.notification_id
            WHERE 
                p.user_id = ?
            LIMIT 
                ${pageSize} OFFSET ${offset}
            `, [userId]
        );

        const [[{ total }]] = await db.execute(`
            SELECT 
                COUNT(*) AS total FROM email_notifications 
            LEFT JOIN 
                notifications AS p ON p.id = email_notifications.notification_id
            WHERE 
                p.user_id = ?
            `, [userId]
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

    async getEmailTemplate({ emailId }) {
        const emailNotification = await this.getById({ id: emailId });
        if (!emailNotification || !emailNotification.template_id) {
            return null;
        }

        const templateId = emailNotification.template_id;
        if (!templateId) {
            return null;
        }

        return await commands.execute('notificationService.getSingleTemplate', { id: emailNotification.template_id });
    },

    async create({ data }) {
        // Generate a unique ID for the notification
        const id = utils.uuid();

        const columns = ['id', ...Object.keys(data).map(db.sql.helpers.toSnake)];
        const placeholders = columns.map(() => '?');
        const values = [
            id,
            ...Object
                .values(data)
                .map(data => Array.isArray(data) || typeof data === 'object' ? JSON.stringify(data) : data)
        ];

        const sql = `INSERT INTO email_notifications (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await db.execute(sql, values);

        return await this.getById({ id });
    },

    async update({ id, data }) {
        // If data is empty, return the existing notification
        if (Object.keys(data).length === 0) {
            return await this.getById({ id });
        }
        const columns = Object.keys(data).map((key) => db.sql.helpers.toSnake(key));
        const assignments = columns.map(col => `${col} = ?`);
        const values = Object.values(data).map(data => Array.isArray(data) || typeof data === 'object' ? JSON.stringify(data) : data);

        const sql = `UPDATE email_notifications SET ${assignments.join(', ')} WHERE id = ?`;

        await db.execute(sql, [...values, id]);
        return this.getById({ id });
    },

    async delete({ id }) {
        await db.query('DELETE FROM email_notifications WHERE id = ?', [id]);
        return true;
    },

    async getLatestByNotificationId({ notificationId }) {
        const [rows] = await db.query(
            `
            SELECT 
                * 
            FROM 
                email_notifications
            WHERE 
                notification_id = ?
            ORDER BY 
                created_at DESC
            LIMIT 1
            `,
            [notificationId]
        );
        return rows?.[0] ? db.sql.helpers.objectToCamelCase(rows[0]) : null;
    },

    async markSent({ id }) {
        await db.execute(
            `
            UPDATE 
                email_notifications
            SET 
                status = 'sent',
                sent_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [id]
        );

        return this.getById({ id });
    },

    async markFailed({ id }) {
        await db.execute(
            `
            UPDATE 
                email_notifications
            SET 
                status = 'failed',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [id]
        );

        return this.getById({ id });
    },
};
