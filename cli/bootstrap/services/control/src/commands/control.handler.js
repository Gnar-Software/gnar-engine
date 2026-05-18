import { commands, logger, db, error } from '@gnar-engine/core';
import { config } from "../config.js";
import { registry } from "../services/registry.service.js";
import { task } from "../services/task.service.js";
import { reset } from "../services/reset.service.js";
import { seeders } from "../services/seeders.service.js";


/**
 * Run migrations
 *
 * @param {Object} params
 * @param {string|Object} params.service The service name or service object
 * @param {string} params.migration The migration name
 * @returns {Promise<void>}
 */
commands.register('controlService.runMigrations', async ({ service, migration } = {}) => {
    if (service) {
        const serviceName = typeof service === 'string' ? service : service.name;

        logger.info(`Running migrations for service: ${serviceName}`);

        if (serviceName === config.serviceName) {
            return await db.migrations.runMigrations({ config });
        }

        return await commands.execute(`${serviceName}.runMigrations`, { migration });
    }

    const services = await registry.getServices();

    logger.info(`Running migrations for services: ${JSON.stringify(services)}`);

    await Promise.all(
        services.map(async (registeredService) => {
            if (registeredService.name === config.serviceName) {
                return await db.migrations.runMigrations({ config });
            }

            return await commands.execute(`${registeredService.name}.runMigrations`, { migration });
        })
    );
})

/**
 * Run seeders for all registered services.
 *
 * @param {Object} params
 * @param {string} params.seeder The seeder type (e.g. 'test', 'development')
 */
commands.register('controlService.runAllSeeders', async ({ seeder }) => {
    const services = await registry.getServices();

    await seeders.runAll({
        services: services,
        seeder: seeder
    });
})

/**
 * Run seeders
 *
 * @param {Object} params
 * @param {string|Object} params.service The service name or service object
 * @param {string} params.seeder The seeder type (e.g. 'test', 'development')
 * @returns {Promise<void>}
 */
commands.register('controlService.runSeeders', async ({ service, seeder } = {}) => {
    if (service) {
        const serviceName = typeof service === 'string' ? service : service.name;

        logger.info(`Running seeders for service: ${serviceName}`);

        if (serviceName === config.serviceName) {
            return await db.seeders.runSeeders({ config, seeder });
        }

        return await commands.execute(`${serviceName}.runSeeders`, { seeder });
    }

    if (seeder) {
        return await commands.execute('controlService.runAllSeeders', { seeder });
    }

    const services = await registry.getServices();

    logger.info(`Running seeders for services: ${JSON.stringify(services)}`);

    await Promise.all(
        services.map(async (registeredService) => {
            if (registeredService.name === config.serviceName) {
                return await db.seeders.runSeeders({ config, seeder });
            }

            return await commands.execute(`${registeredService.name}.runSeeders`, { seeder });
        })
    );
})

/**
 * Run full database reset (centrally)
 */
commands.register('controlService.runReset', async () => {
    const services = await registry.getServices();

    await reset.allServiceDatabases({
        services: services
    });
})

/**
 * Run health check
 * ----------------
 *
 * Checks registered services are available and have no failed tasks.
 */
commands.register('controlService.runHealthcheck', async () => {
    const services = await registry.getServices();

    const results = await Promise.all(
        services.map(async (service) => {
            try {
                const result = await commands.execute(`${service.name}.internalHealthCheck`);
                return { service: service.name, result };
            } catch (healthCheckError) {
                return {
                    service: service.name,
                    error: `Error checking health of ${service.name}: ${healthCheckError}`
                };
            }
        })
    );

    const errors = results
        .filter(result => result.error)
        .map(result => result.error);

    const failedTasks = await task.getTasksByStatus({
        status: 'failed'
    });

    if (failedTasks.length > 0) {
        errors.push(`${failedTasks.length} failed tasks`);
    }

    if (errors.length > 0) {
        throw new error.failedHealthCheck(JSON.stringify(errors));
    }

    logger.info('Health check passed');
})

/**
 * Internal health check (kills process if it fails)
 */
commands.register('controlService.internalHealthCheck', async () => {
    try {
        await db.checkConnection();
    } catch (err) {
        logger.error('[Internal health check] Failed - Exiting. Error connecting to MYSQL: ' + err);
        process.exit(1);
    }
})
