import { logger, db, utils } from '@gnar-engine/core';
import { config} from '../config.js';


/**
 * User Service
 */
export const user = {

    // Get all users
    getAll: async ({ pageSize = 100, pageNum = 1, ids = [], orderBy = { email: 'ASC' } }) => {
        pageSize = Number(pageSize);
        pageNum = Number(pageNum);

        const offset = (pageNum - 1) * pageSize;

        const whereClauses = [];
        const params = [];

        if (ids?.length) {
            whereClauses.push(`id IN (${ids.map(() => '?').join(', ')})`);
            params.push(...ids);
        }

        const whereSql = whereClauses.length
            ? `WHERE ${whereClauses.join(' AND ')}`
            : '';

        const orderByKeys = Object.keys(orderBy);
        const orderByClauses = orderByKeys.map(key => `${db.sql.helpers.toSnake(key)} ${orderBy[key]}`);
        const orderBySql = orderByClauses.length ? `ORDER BY ${orderByClauses.join(', ')}` : '';

        const [rows] = await db.query(
            `SELECT * FROM users ${whereSql} ${orderBySql} LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM users ${whereSql}`,
            params
        );

        let users = rows.map(row => db.sql.helpers.objectToCamelCase(row));

        // santize the users by removing the password and apiKey fields
        users = users.map(user => {
            const { password, apiKey, ...rest } = user;
            return rest;
        });

        return {
            data: users,
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
                passwordHash = utils.hash(password, config.hashNameSpace);
            }
            console.log('creating user');
            const [result] = await db.execute(
                'INSERT INTO `users` (`id`, `email`, `password`, `username`, `role`, `api_key`) VALUES (?, ?, ?, ?, ?, ?)',
                [id, email, passwordHash, username, role, apiKey]
            );

            const [newUser] = await db.execute(
                'SELECT * FROM `users` WHERE `id` = ?',
                [id]
            );

            // sanitize
            const userObj = newUser[0];
            const { password, apiKey, ...rest } = userObj;

            return rest;
        } catch (error) {
            logger.error("Error creating user:", error);
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

            // sanitize
            const userObj = result[0];
            const { password, apiKey, ...rest } = userObj;

            return rest;
        } catch (error) {
            logger.error("Error fetching user:", error);
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

            // sanitize
            const userObj = result[0];
            const { password, apiKey, ...rest } = userObj;

            return rest;
        } catch (error) {
            logger.error("Error fetching user by email:", error);
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

            // sanitize
            const userObj = updatedUser[0];
            const { password, apiKey, ...rest } = userObj;

            return rest;
        } catch (error) {
            logger.error("Error updating user:", error);
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
            logger.error("Error deleting user:", error);
            throw error;
        }
    }

};
