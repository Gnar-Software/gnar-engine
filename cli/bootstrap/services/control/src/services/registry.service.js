import { db, utils, logger } from '@gnar-engine/core';


/**
 * Registry Service
 */
export const registry = {

    // get service by name
    getServiceByName: async ({ name }) => {
        try {
            const [result] = await db.execute(
                'SELECT * FROM `service_registry` WHERE `name` = ?',
                [name]
            );

            return result.length > 0 ? db.sql.helpers.objectToCamelCase(result[0]) : null;
        } catch (error) {
            logger.error("Error getting service: " + error);
            throw error;
        }
    },

    // register service
    registerService: async ({name, manifest = {}}) => {
        try {
            const [result] = await db.execute(
                'INSERT INTO `service_registry` (`id`, `name`, `manifest`) VALUES (?, ?, ?)',
                [utils.uuid(), name, manifest]
            );

            return registry.getServiceByName({ name });
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
                'SELECT * FROM `service_registry`'
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
    },

    /**
     * Add service replica
     *
     * @param {string} serviceName Name of the service
     * @param {number} replicaSlot Slot number of the replica
     * @param {string} replicaHostname Hostname of the replica
     * @param {string} replicaIp IP address of the replica
     */
    addServiceReplica: async ({ serviceName, replicaSlot, replicaHostname, replicaIp }) => {
        try {
            await db.execute(
                'INSERT INTO `service_replicas` (`service_name`, `replica_slot`, `replica_hostname`, `replica_ip`) VALUES (?, ?, ?, ?)',
                [serviceName, replicaSlot, replicaHostname, replicaIp]
            );

            return registry.getServiceReplicaByHostname({ replicaHostname });
        } catch (error) {
            logger.error("Error adding service replica: " + error);
            throw error;
        }
    },

    /**
     * Remove service replica
     *
     * @param {string} replicaId ID of the replica to remove
     */
    removeServiceReplica: async ({ replicaHostname }) => {
        try {
            await db.execute(
                'DELETE FROM `service_replicas` WHERE `replica_hostname` = ?',
                [replicaHostname]
            );
        } catch (error) {
            logger.error("Error removing service replica: " + error);
            throw error;
        }
    },

    /**
     * Get replicas for a service
     *
     * @param {string} serviceName Name of the service
     * @returns {Promise<Array>} List of replica
     */
    getServiceReplicas: async ({ serviceName }) => {
        try {
            const [result] = await db.execute(
                'SELECT * FROM `service_replicas` WHERE `service_name` = ?',
                [serviceName]
            );

            return result.map(row => db.sql.helpers.objectToCamelCase(row));
        } catch (error) {
            logger.error("Error getting service replicas: " + error);
            throw error;
        }
    },

    /**
     * Get service replica by hostname
     *
     * @param {string} replicaHostname Hostname of the replica
     * @returns {Promise<Object>} The service replica data
     */
    getServiceReplicaByHostname: async ({ replicaHostname }) => {
        try {
            const [result] = await db.execute(
                'SELECT * FROM `service_replicas` WHERE `replica_hostname` = ?',
                [replicaHostname]
            );

            return result.length > 0 ? db.sql.helpers.objectToCamelCase(result[0]) : null;
        } catch (error) {
            logger.error("Error getting service replica: " + error);
            throw error;
        }
    }
}
