import { logger, commands } from '@gnar-engine/core';


/**
 * Registry Service
 */
export const reset = {


    /**
     * Reset all service databases
     *
     * @param {Object} params
     * @param {Array} params.services The list of services
     * @returns {Promise<boolean>} Success status
     */
    allServiceDatabases: async ({ services }) => {

        if (process.env.NODE_ENV === 'production') {
            throw new Error("Reset is not allowed in production environment");
        }

        logger.info("Resetting all service databases...");

        let resetSuccess = true;

        const promises = services.map(async (service) => {
            if (service.name == 'controlService') {
                return;
            }

            try {
                await commands.execute(`${service.name}.runMigrations`);
            } catch (error) {
                resetSuccess = false;
                logger.error(
                    `Error resetting database for service ${service.name}: ${error}`
                );
            }
        });

        await Promise.all(promises);
        logger.info('Reset complete');

        return resetSuccess;
    }

}
