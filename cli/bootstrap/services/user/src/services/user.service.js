import { logger, db, utils } from '@gnar-engine/core';
import { config } from '../config.js';


/**
 * User Service
 */
export const user = {

    search: async ({ term, keys, pageSize = 100, pageNum = 1 }) => {

        logger.info('SEARCHING FOR USERS.', {term, keys})
        pageSize = Number(pageSize);
        pageNum = Number(pageNum);
        const offset = (pageNum - 1) * pageSize;

        const searchColumns = keys.map(db.sql.helpers.toSnake);
        const likeTerm = `%${term}%`;

        // Build WHERE clauses
        const whereClauses = searchColumns.map(col => `${col} LIKE ?`);

        // Build params
        const params = searchColumns.map(() => likeTerm);

        // Fetch paginated results
        const [rows] = await db.query(
            `
            SELECT
                *
            FROM
                users
            WHERE
                (${whereClauses.join(' OR ')})
            LIMIT
                ?
            OFFSET
                ?`,
            [...params, pageSize, offset]
        );

        // Count total matching rows
        const [[{ total }]] = await db.query(
            `
            SELECT
                COUNT(*) AS total
            FROM
                users
            WHERE
                (${whereClauses.join(' OR ')})`,
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

    // Get all users
    getAll: async ({ pageSize = 100, pageNum = 1, filters = {}, ids = [] }) => {
        pageSize = Number(pageSize);
        pageNum = Number(pageNum);

        const offset = (pageNum - 1) * pageSize;

        const whereClauses = [];
        const params = [];

        Object.keys(filters).forEach(key => {
            whereClauses.push(`${db.sql.helpers.toSnake(key)} = ?`);
            params.push(filters[key]);
        });

        if (ids?.length) {
            whereClauses.push(`id IN (${ids.map(() => '?').join(', ')})`);
            params.push(...ids);
        }

        const whereSql = whereClauses.length
            ? `WHERE ${whereClauses.join(' AND ')}`
            : '';

        const [rows] = await db.query(
            `SELECT * FROM users ${whereSql} LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM users ${whereSql}`,
            params
        );

        return {
            data: rows.map(row => db.sql.helpers.objectToCamelCase(row)),
            pagination: {
                pageSize,
                pageNum,
                total
            }
        };
    },

    // Create a user
    create: async ({ email, role, password = null, username = null, apiKey = null }) => {
        try {
            const id = utils.uuid();
            let passwordHash = null;

            if (password) {
                passwordHash = await utils.hash(password, config.hashNameSpace);
            }

            const [result] = await db.execute(
                'INSERT INTO `users` (`id`, `email`, `password`, `username`, `role`, `api_key`) VALUES (?, ?, ?, ?, ?, ?)',
                [id, email, passwordHash, username, role, apiKey]
            );

            const [newUser] = await db.execute(
                'SELECT * FROM `users` WHERE `id` = ?',
                [id]
            );

            return newUser[0];
        } catch (error) {
            logger.error("Error creating user: " + error);
            throw error;
        }
    },

    // Get a user by ID
    getById: async ({ id }) => {
        try {

            const [result] = await db.execute(
                'SELECT * FROM `users` WHERE `id` = ?',
                [id]
            );

            if (!result || result.length === 0) {
                return null;
            }

            return result[0];
        } catch (error) {
            logger.error("Error fetching user: " + error);
            throw error;
        }
    },

    // Get a user by email
    getByEmail: async ({ email }) => {
        try {
            const [result] = await db.execute(
                'SELECT * FROM `users` WHERE `email` = ?',
                [email]
            );

            if (!result || result.length === 0) {
                return null;
            }

            return result[0];
        } catch (error) {
            logger.error("Error fetching user by email: " + error);
            throw error;
        }
    },

    // Update a user
    update: async ({ id, username, email, role }) => {
        try {
            const [result] = await db.execute(
                'UPDATE `users` SET `username` = ?, `email` = ?, `role` = ? WHERE `id` = ?',
                [username, email, role, id]
            );

            const [updatedUser] = await db.execute(
                'SELECT * FROM `users` WHERE `id` = ?',
                [id]
            );

            return updatedUser[0];
        } catch (error) {
            logger.error("Error updating user: " + error);
            throw error;
        }
    },

    // Delete a user
    delete: async ({ id }) => {
        try {
            const [sessionResult] = await db.execute(
                'DELETE FROM sessions WHERE user_id = ?',
                [id]
            );

            const [userResult] = await db.execute(
                'DELETE FROM `users` WHERE `id` = ?',
                [id]
            );

            return userResult.affectedRows;
        } catch (error) {
            logger.error("Error deleting user: " + error);
            throw error;
        }
    },

    // Change password
    changePassword: async ({ id, newPassword }) => {
        try {
            const [result] = await db.execute(
                'UPDATE `users` SET `password` = ? WHERE `id` = ?',
                [newPassword, id]
            );

            return result.affectedRows;
        } catch (error) {
            logger.error("Error changing password: " + error);
            throw error;
        }
    }
};
