import { logger, db, utils } from 'gnarengine-service-core';
import { config} from '../config.js';


/**
 * User Service
 */
export const user = {

    // Get all users
    getAll: async () => {
        try {
            const [results, fields] = await db.execute(
                'SELECT id, username, email, role FROM `users`'
            );

            return results;
        } catch (error) {
            logger.error("Error fetching users:", error);
            throw error;
        }
    },

    // Create a user
    create: async ({email, role, password = null, username = null, apiKey = null}) => {
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

            return newUser[0];
        } catch (error) {
            logger.error("Error creating user:", error);
            throw error;
        }
    },

    // Get a user by ID
    getById: async ({id}) => {
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
            logger.error("Error fetching user:", error);
            throw error;
        }
    },

    // Get a user by email
    getByEmail: async ({email}) => {
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
            logger.error("Error fetching user by email:", error);
            throw error;
        }
    },

    // Update a user
    update: async ({id, username, email, role}) => {
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
            logger.error("Error updating user:", error);
            throw error;
        }
    },

    // Delete a user
    delete: async ({id}) => {
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