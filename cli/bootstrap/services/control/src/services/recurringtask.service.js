import { db, utils } from '@gnar-engine/core';

export const recurringTask = {
    async getById({ id }) {
        const [result] = await db.query('SELECT * FROM recurring_tasks WHERE id = ?', [id]);

        if (!result || !result[0]?.id) {
            return null;
        }

        return db.sql.helpers.objectToCamelCase(result[0]);
    },

    async getByIdempotencyKey({ idempotencyKey }) {
        const [result] = await db.query('SELECT * FROM recurring_tasks WHERE idempotency_key = ?', [idempotencyKey]);

        if (!result || !result[0]?.id) {
            return null;
        }

        return db.sql.helpers.objectToCamelCase(result[0]);
    },

    async getAll({ pageSize = 100, pageNum = 1 }) {
        pageSize = Number(pageSize);
        pageNum  = Number(pageNum);
        const offset = (pageNum - 1) * pageSize;

        const [rows] = await db.query(
            'SELECT * FROM recurring_tasks LIMIT ? OFFSET ?',
            [pageSize, offset]
        );

        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) AS total FROM recurring_tasks'
        );

        return {
            data: rows.map(row => db.sql.helpers.objectToCamelCase(row)),
            pagination: {
                pageSize,
                pageNum,
                total
            }
        }
    },

    async create(data) {
        const id = utils.uuid();

        // map columns and insert
        const columns = ['id', ...Object.keys(data).map(db.sql.helpers.toSnake)];
        const placeholders = columns.map(() => '?');

        const values = [
            id,
            ...Object.values(data).map(value =>
                typeof value === 'object' && value !== null
                    ? JSON.stringify(value)
                    : value
            )
        ];

        const sql = `
            INSERT INTO recurring_tasks (
                ${columns.join(', ')},
                created_at,
                updated_at
            )
            VALUES (
                ${placeholders.join(', ')},
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
        `;

        await db.query(sql, values);

        // return result
        const newItem = await this.getById({ id });
        return db.sql.helpers.objectToCamelCase(newItem);
    },

    async update({ id, updatedData }) {
        if (!Object.keys(updatedData).length) {
            return this.getById({ id });
        }

        const columns = Object.keys(updatedData).map(db.sql.helpers.toSnake);

        const setClause = columns.map(col => `${col} = ?`).join(', ');

        const values = Object.values(updatedData).map(value =>
            typeof value === 'object' && value !== null
                ? JSON.stringify(value)
                : value
        );

        const sql = `
            UPDATE recurring_tasks
            SET ${setClause},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await db.query(sql, [...values, id]);

        const newItem = await this.getById({ id });
        return db.sql.helpers.objectToCamelCase(newItem);
    },

    async delete({ id }) {
        await db.query('DELETE FROM recurring_tasks WHERE id = ?', [id]);
        return true;
    },
};
