import { logger, db, utils } from '@gnar-engine/core';
import { config } from '../config.js';


/**
 * Authentication Service
 */
export const auth = {

    /**
     * Create new authenticated session
     * 
     * @param {*} userId 
     * @returns {string} Session token
     */
    createSessionToken: async (userId) => {
      
        try {
            const token = utils.uuid();

            const [result] = await db.execute(
                'INSERT INTO `sessions` (`token`, `user_id`) VALUES (?, ?)',
                [token, userId]
            );

            return token;
        } catch (error) {
            logger.error("Error creating session token: " + error);
            throw error;
        }
    },
    
    /**
     * Get authenticated user from token
     * 
     * @param {string} token - Session token
     * @returns {int} User ID
     */
    getAuthenticatedUser: async (token) => {

        try {
            const [result] = await db.execute(
                'SELECT * FROM `sessions` WHERE `token` = ?',
                [token]
            );

            if (result.length === 0) {
                return null;
            }

            const session = result[0];
            const createdAt = new Date(session.created_at);
            const now = new Date(); 
            const oneHour = 60 * 60 * 1000;
            if (now - createdAt > oneHour) {
                return null;
            }

            return result[0].user_id;
        } catch (error) {
            logger.error("Error fetching authenticated user:" + error);
            throw error;
        }
    },

    /**
     * Verify user credentials
     * 
     * @param {Object} params
     * @param {string} params.username - Username (or email)
     * @param {string} params.password - Password
     * @returns {int} User ID
     */
    verifyCredentials: async ({username, password}) => {

        const passwordHash = utils.hash(password, config.hashNameSpace);

        try {
            // try username
            let [result] = await db.execute(
                'SELECT * FROM `users` WHERE `username` = ? AND `password` = ?',
                [username, passwordHash]
            );

            if (result.length > 0) {
                return result[0].id;
            }

            // try username as email
            [result] = await db.execute(
                'SELECT * FROM `users` WHERE `email` = ? AND `password` = ?',
                [username, passwordHash]
            );

            if (result.length > 0) {
                return result[0].id;
            }
        } catch (error) {
            logger.error("Error verifying credentials:" + error);
            throw error;
        }
    },

    /**
     * Verify API key with username
     * 
     * @param {Object} params
     * @param {string} params.apiKey - API key
     * @param {string} params.username - Username
     * @returns {int} User ID
     */
    verifyApiKey: async ({apiKey, username}) => {
        try {
            const [result] = await db.execute(
                'SELECT * FROM `users` WHERE `api_key` = ? AND `username` = ?',
                [apiKey, username]
            );

            if (result.length > 0) {
                return result[0].id;
            }
        } catch (error) {
            logger.error("Error verifying API key:" + error);
            throw error;
        }
    }
};
