import { logger, db, utils } from 'gnarengine-service-core';


/**
 * Authentication Service
 */
export const unauthenticatedSession = {

    /**
     * Create new unauthenticated session token
     * 
     * @returns {string} Session token
     */
    createSessionToken: async () => {
      
        try {
            const sessionToken = utils.uuid();

            const [result] = await db.execute(
                'INSERT INTO `unauthenticated_sessions` (`token`) VALUES (?)',
                [sessionToken]
            );

            return sessionToken;
        } catch (error) {
            logger.error("Error creating unauthenticated session token: " + error);
            throw error;
        }
    },
    
    /**
     * Verify unauthenticated session token
     * 
     * @param {Object} params
     * @param {string} params.sessionToken
     * @returns {boolean} Session token valid
     */
    verifySessionToken: async ({sessionToken}) => {

        try {
            [result] = await db.execute(
                'SELECT * FROM `unauthenticated_sessions` WHERE `token` = ?',
                [sessionToken]
            );

            if (result.length > 0) {
                if (result[0].expires_at > new Date()) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            logger.error("Error verifying unauthenticated session token:", error);
            throw error;
        }
    }
}