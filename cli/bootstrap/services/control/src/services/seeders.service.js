import { logger, commands } from '@gnar-engine/core';


export const seeders = {

    /**
     * Run all service seeders
     *
     * @param {Object} params
     * @param {Array} params.services The list of services
     * @param {string} params.seeder The seeder type (e.g. 'test', 'development')
     * @returns {Promise<boolean>} Success status
     */
    runAll: async ({ services, seeder }) => {

        if (process.env.NODE_ENV === 'production') {
            throw new Error("Re-seeding is not allowed in production environment");
        }

        if (!seeder) {
            throw new Error("Seeder parameter is required e.g. 'test', 'development'");
        }

        logger.info(`Running ${seeder} seeders for all services...`);

        let seedSuccess = true;

        const promises = services.map(async (service) => {
            if (service.name == 'controlService') {
                return;
            }
            logger.info(`Seeding service: ${service.name}`);

            try {
                await commands.execute(`${service.name}.runSeeders`, { seeder });
            } catch (error) {
                seedSuccess = false;
                logger.error(
                    `Error seeding service ${service.name}: ${error}`
                );
            }
        });

        await Promise.all(promises);
        logger.info('Seeders complete');

        return seedSuccess;
    }
}
