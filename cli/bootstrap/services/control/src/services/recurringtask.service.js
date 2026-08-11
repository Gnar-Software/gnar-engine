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

    async getAll({ pageSize = 100, pageNum = 1, filters = {}, orderBy = { key: 'nextRunAt', direction: 'ASC' } }) {
        pageSize = Number(pageSize);
        pageNum  = Number(pageNum);
        const offset = (pageNum - 1) * pageSize;

        // Build filter clauses, including operator filters used by scheduler lookups.
        const filterKeys = Object.keys(filters);
        const whereClauses = [];
        const params = [];

        for (const key of filterKeys) {
            const column = db.sql.helpers.toSnake(key);
            const filter = filters[key];

            if (filter && typeof filter === 'object' && filter.operator) {
                let operator = '=';

                if (filter.operator === 'lte') operator = '<=';
                if (filter.operator === 'gte') operator = '>=';
                if (filter.operator === 'lt') operator = '<';
                if (filter.operator === 'gt') operator = '>';
                if (filter.operator === 'ne') operator = '!=';

                whereClauses.push(`${column} ${operator} ?`);
                params.push(filter.value);
            } else {
                whereClauses.push(`${column} = ?`);
                params.push(filter);
            }
        }

        const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const allowedOrderColumns = ['next_run_at', 'starts_at', 'ends_at', 'created_at', 'updated_at'];
        const orderColumn = db.sql.helpers.toSnake(orderBy?.key || 'nextRunAt');
        const safeOrderColumn = allowedOrderColumns.includes(orderColumn) ? orderColumn : 'next_run_at';
        const safeOrderDirection = String(orderBy?.direction).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const [rows] = await db.query(
            `SELECT * FROM recurring_tasks ${whereSql} ORDER BY ${safeOrderColumn} ${safeOrderDirection} LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM recurring_tasks ${whereSql}`,
            params
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
