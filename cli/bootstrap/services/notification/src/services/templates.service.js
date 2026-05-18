import { db, utils, logger } from '@gnar-engine/core';
import { slugifyIdentifier as slugify } from '../utils/parsers.js';

export const templates = {
    async getById({ id }) {
        const [result] = await db.query('SELECT * FROM notification_templates WHERE id = ?', [id]);
        return db.sql.helpers.objectToCamelCase(result[0] || {});
    },

    async getAll({ pageSize = 100, pageNum = 1, filters = {}, ids = [] }) {
        pageSize = Number(pageSize);
        pageNum = Number(pageNum);
        const offset = (pageNum - 1) * pageSize;

        // Ensure archvied filter defaults to false if not provided
        if (filters.archived === undefined) {
            filters.archived = false;
        }

        // Ensure fetching the latest versions of templates by default if not provided in filters
        if (filters.latest === undefined) {
            filters.latest = true;
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

        const [rows] = await db.query(
            `SELECT * FROM notification_templates ${whereSql} LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM notification_templates ${whereSql}`,
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

    async getByCreatedBy({ createdBy }) {
        const [result] = await db.query('SELECT * FROM notification_templates WHERE created_by = ?', [createdBy]);
        return result.map(row => db.sql.helpers.objectToCamelCase(row));
    },

    /**
     * Fetches the template by its slug. Defaults to the latest version unless a specific version is provided.
     * @param {Object} param0
     * @param {string} param0.slug
     * @param {number|null} param0.version 
     * @returns 
     */
    async getBySlug({ slug, version = null }) {
        // If version is provided, get that specific version
        let sql = 'SELECT * FROM notification_templates WHERE slug = ? AND latest = TRUE';
        const params = [slug];

        if (version !== null) {
            sql = 'SELECT * FROM notification_templates WHERE slug = ? AND version = ?';
            params.push(version);
        }

        const [result] = await db.query(sql, params);
        return db.sql.helpers.objectToCamelCase(result[0] || {});
    },

    async create({ data }) {
        // Generate a unique ID for the template
        const id = utils.uuid();

        const dataCopy = { ...data };

        // Get the name and generate slug
        const name = dataCopy.name;
        const slug = slugify(name);
        dataCopy.slug = slug;

        // Query the DB to see if there is an existing entry with the same slug
        // If so, throw an error (do not allow duplicate names)
        const existingTemplate = await this.getBySlug({ slug });
        if ((existingTemplate && existingTemplate.latest) || (dataCopy.version && dataCopy.version <= existingTemplate?.version)) {
            throw new Error('Template with this name already exists');
        }

        const columns = ['id', ...Object.keys(dataCopy).map(db.sql.helpers.toSnake)];
        const placeholders = columns.map(() => '?');
        const values = [id, ...Object.values(dataCopy)];

        const sql = `INSERT INTO notification_templates (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await db.execute(sql, values);

        return await this.getById({ id });
    },

    async update({ id, data }) {
        // If data is empty, return the existing notification
        if (Object.keys(data).length === 0) {
            return await this.getById({ id });
        }

        // Update Steps should be:
        // 1. Mark existing template latest = false
        // 2. Create new template with incremented version number

        const existingTemplate = await this.getById({ id });
        if (!existingTemplate) {
            throw new Error('Template to update not found');
        }
        const newVersion = parseInt(existingTemplate.version) + 1;

        const updateQuery = 'UPDATE notification_templates SET latest = FALSE WHERE id = ?';
        await db.execute(updateQuery, [id]);

        const newTemplate = await this.create({ data: { ...data, version: newVersion } });

        return newTemplate;
    },

    async delete({ id }) {
        await db.query('DELETE FROM notification_templates WHERE id = ?', [id]);
        return true;
    },
};
