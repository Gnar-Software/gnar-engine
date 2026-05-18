import { db, utils, commands } from '@gnar-engine/core';

export const notification = {
    async getById({ id }) {
        const [result] = await db.execute('SELECT * FROM notifications WHERE id = ?', [id]);
        return result[0] || null;
    },

    async getByEmail({ email }) {
        // Placeholder: implement if your service uses email
        return null;
    },

    async getAllByUserId({ userId, pageSize = 100, pageNum = 1 }) {
        pageSize = Number(pageSize);
        pageNum = Number(pageNum);
        const offset = (pageNum - 1) * pageSize;

        const rows = await db.query(
            `SELECT * FROM notifications WHERE user_id = ? LIMIT ${pageSize} OFFSET ${offset}`,
            [userId]
        );

        const [{ total }] = await db.query(
            'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?',
            [userId]
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

    /**
     * orderBy: You need to add the table prefix to order by its columns due to the joins
     * (e.g. 'n.created_at' instead of 'createdAt').
     */
    async getAll({
        pageSize = 100,
        pageNum = 1,
        filters = {},
        ids = [],
        orderBy = { 'n.created_at': 'DESC' }
    }) {
        pageSize = Number(pageSize);
        pageNum = Number(pageNum);
        const offset = (pageNum - 1) * pageSize;

        // If there is no archived filter, add one to exclude archived notifications by default
        if (!('archived' in filters)) {
            filters.archived = false;
        }

        // Build WHERE clauses
        const filterKeys = Object.keys(filters);
        const whereClauses = filterKeys.map(key => `${db.sql.helpers.toSnake(key)} = ?`);

        // If the ids are there push them to the where clause
        if (ids.length) {
            whereClauses.push(`id IN (${ids.map(() => '?').join(',')})`);
        }
        const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Build params
        const params = filterKeys.map(key => filters[key]);

        // If the ids are there push them to the params
        if (ids.length) {
            params.push(...ids);
        }

        // Build order by
        const orderByKeys = Object.keys(orderBy);
        const orderByClauses = orderByKeys.map(key => `${db.sql.helpers.toSnake(key)} ${orderBy[key]}`);
        const orderBySql = orderByClauses.length ? `ORDER BY ${orderByClauses.join(', ')}` : '';

        const [rows] = await db.query(
            `
            SELECT
                n.*,

                en.id                   AS email_id,
                en.email_address        AS email_address,
                en.cc_email_addresses   AS email_cc_email_addresses,
                en.bcc_email_addresses  AS email_bcc_email_addresses,
                en.from_email           AS email_from_email,
                en.subject_line         AS email_subject_line,
                en.content              AS email_content,
                en.template_id          AS email_template_id,
                en.template_slug        AS email_template_slug,
                en.status               AS email_status,
                en.sent_at              AS email_sent_at,
                en.created_at           AS email_created_at,
                en.updated_at           AS email_updated_at,
                en.updated_by_user      AS email_updated_by_user,

                sn.id                  AS stored_id,
                sn.content             AS stored_content,
                sn.status              AS stored_status,
                sn.created_at          AS stored_created_at,
                sn.updated_at          AS stored_updated_at,
                sn.updated_by_user     AS stored_updated_by_user

            FROM
                notifications n
            LEFT JOIN
                email_notifications  en ON en.notification_id = n.id
            LEFT JOIN
                stored_notifications sn ON sn.notification_id = n.id
            ${whereSql}
            ${orderBySql}
            LIMIT
                ?
            OFFSET
                ?
            `,
            [...params, pageSize, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM notifications ${whereSql}`,
            params
        );

        return {
            data: rows.map(row => {
                const base = db.sql.helpers.objectToCamelCase(row);
                return this.shapeNotification(base);
            }),
            pagination: {
                pageSize,
                pageNum,
                total
            }
        }
    },

    async create({ data }) {
        // Generate a unique ID for the notification
        const id = utils.uuid();

        const columns = ['id', ...Object.keys(data).map(db.sql.helpers.toSnake)];
        const placeholders = columns.map(() => '?');
        const values = [id, ...Object.values(data)];

        const sql = `INSERT INTO notifications (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
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
        const values = Object.values(data);

        const sql = `UPDATE notifications SET ${assignments.join(', ')} WHERE id = ?`;

        await db.execute(sql, [...values, id]);
        return this.getById({ id });
    },

    /**
     * Archive all notifications by IDs
     */
    async archive({ ids }) {

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new Error('Array of notification IDs required for archiving');
        }

        const placeholders = ids.map(() => '?').join(', ');
        const sql = `
            UPDATE
                notifications
            SET
                archived = true
            WHERE
                id IN (${placeholders})
        `;
        await db.execute(sql, ids);

        // Return the updated notifications
        const [rows] = await db.query(
            `
            SELECT
                *
            FROM
                notifications
            WHERE
                id IN (${placeholders})
            `,
            ids
        );

        return rows.map(row => db.sql.helpers.objectToCamelCase(row));
    },

    async delete({ id }) {
        await db.execute('DELETE FROM notifications WHERE id = ?', [id]);
        return true;
    },

    async checkIdempotent({ idempotencyKey }) {
        if (!idempotencyKey) {
            return true;
        }

        const [result] = await db.execute('SELECT id FROM notifications WHERE idempotency_key = ?', [idempotencyKey]);
        return result.length === 0;
    },

    // Shape notification with its child notification data utility function
    shapeNotification(row) {

        // Strip all child-prefixed keys from the base object
        const base = Object.fromEntries(
            Object.entries(row).filter(([key]) =>
                !key.startsWith('email') && !key.startsWith('stored')
            )
        );

        const typeMap = {
            email: () => ({
                childId: row.emailId,
                emailAddress: row.emailEmailAddress,      // JSON array
                ccEmailAddresses: row.emailCcEmailAddresses,  // JSON array
                bccEmailAddresses: row.emailBccEmailAddresses, // JSON array
                fromEmail: row.emailFromEmail,
                subjectLine: row.emailSubjectLine,
                content: row.emailContent,
                templateId: row.emailTemplateId,
                templateSlug: row.emailTemplateSlug,
                status: row.emailStatus,
                sentAt: row.emailSentAt,
                createdAt: row.emailCreatedAt,
                updatedAt: row.emailUpdatedAt,
                updatedByUser: row.emailUpdatedByUser,
            }),
            stored: () => ({
                childId: row.storedId,
                content: row.storedContent,
                status: row.storedStatus,
                createdAt: row.storedCreatedAt,
                updatedAt: row.storedUpdatedAt,
                updatedByUser: row.storedUpdatedByUser,
            })
        };

        const childData = typeMap[row.type]?.() ?? {};

        return { ...base, ...childData };
    },
};
