import { logger } from '@gnar-engine/core';


/**
 * Registry Service
 */
export const reset = {

    // drop MYSQL databases
    dropMysqlDatabases: async () => {
        try {
            throw new Error("Not implemented");
        } catch (error) {
            logger.error("Error resetting MYSQL: " + error);
            throw error;
        }
    },

    // drop all mongodb collections
    dropMongoCollections: async () => {
        try {
            throw new Error("Not implemented");
        } catch (error) {
            logger.error("Error resetting MYSQL: " + error);
            throw error;
        }
    }
}
