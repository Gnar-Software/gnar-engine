import { db, utils, logger } from 'gnarengine-service-core';


/**
 * Registry Service
 */
export const registry = {

    // register service
    registerService: async ({name, manifest}) => {
        try {
            const [result] = await db.execute(
                'INSERT INTO `service_registry` (`id`, `name`, `manifest`) VALUES (?, ?, ?)',
                [utils.uuid(), name, manifest]
            );

            return result.insertId;
        } catch (error) {
            logger.error("Error registering service: " + error);
            throw error;
        }
    },

    updateService: async ({name, manifest}) => {
        try {
            const [result] = await db.execute(
                'UPDATE `service_registry` SET `manifest` = ?, `updated_at` = CURRENT_TIMESTAMP WHERE `name` = ?',
                [manifest, name]
            );
            return result.affectedRows;
        } catch (error) {
            logger.error("Error updating service: " + error);
            throw error;
        }
    },

    // get services
    getServices: async () => {
        try {
            const [result] = await db.execute(
                'SELECT name FROM `service_registry`'
            );

            return result;
        } catch (error) {
            logger.error("Error getting services: " + error);
            throw error;
        }
    },

    /**
     * Get services with manifests
     */
    getServicesWithManifests: async () => {
        try {
            const [result] = await db.execute(
                'SELECT * FROM `service_registry`'
            );

            return result;
        } catch (error) {
            logger.error("Error getting services: " + error);
            throw error;
        }
    },


    /**
     * Get manifests
     */
    getManifests: async () => {
        try {
            const [result] = await db.execute(
                'SELECT manifest FROM `service_registry`'
            );

            return result;
        } catch (error) {
            logger.error("Error getting manifests: " + error);
            throw error;
        }
    }
}
