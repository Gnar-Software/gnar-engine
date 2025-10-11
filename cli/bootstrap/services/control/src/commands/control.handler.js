import { commands, logger, message, db } from 'gnarengine-service-core';
import { registry } from "../services/registry.service.js";
import { task } from "../services/task.service.js";
import { reset } from "../services/reset.service.js";


/**
 * Run migrations
 * 
 * @param {Object} params
 * @param {string} params.service The service name
 * @param {string} params.migration The migration name
 * @returns {Promise<void>}
 */
commands.register('controlService.runMigrations', async ({service, migration}) => {
    let response;

    // run single migration
    if (service && migration) {
        logger.info(`Running migration: ${migration} for service: ${service}`);

        const payload = {
            method: 'runMigrations',
            data: {
                migration: migration
            }
        };

        // send message to service queue
        try {
            response = await message.sendAndForget(service.name, payload);
        } catch (error) {
            throw error;
        }
    }

    // run all migrations for service
    else if (service) {
        logger.info(`Running migrations for service: ${service}`);

        if (service == 'controlService') {
            try {
                await migrations.runMigrations();
                return;
            } catch (error) {
                throw error;
            }
        }

        const payload = {
            method: 'runMigrations',
        };

        // send message to service queue
        try {
            response = await message.sendAndForget(service.name, payload);
        } catch (error) {
            throw error;
        }
    }

    // run all migrations
    else {
        // get registered services
        const services = await registry.getServices();

        logger.info(`Running migrations for services: ${JSON.stringify(services)}`);

        // run migrations for each service
        const migrationPromises = services.map(async (service) => {
            const payload = { 
                method: 'runMigrations'
            };

            try {
                return await message.sendAndForget(service.name, payload);
            } catch (error) {
                throw error;
            }
        });

        const responses = await Promise.all(migrationPromises);
    }

    return response;
})

/**
 * Run seeders
 * 
 * @param {Object} params
 * @param {string} params.service The service name
 * @returns {Promise<void>}
 */
commands.register('controlService.runSeeders', async ({service}) => {
    let response;

    // run seeders for service
    if (service) {
        logger.info(`Running seeders for service: ${service}`);

        const payload = {
            method: 'runSeeders',
        };

        // send message to service queue
        try {
            response = await message.sendAndForget(service.name, payload);
        } catch (error) {
            throw error
        }
    }

    // run seeders for all services
    else {
        // get registered services
        const services = await registry.getServices();

        logger.info(`Running seeders for services: ${JSON.stringify(services)}`);

        // run seeders for each service
        for (const service of services) {
            const payload = {
                method: 'runSeeders',
            };

            // send message to service queue
            try {
                response = await message.sendAndForget(service.name, payload);
            } catch (error) {
                throw error
            }
        }
    }

    return response;
})

/**
 * Run full database reset (centrally)
 */
commands.register('controlService.runReset', async () => {

    if (process.env.NODE_ENV !== 'development') {
        throw new Error("Reset is only allowed in development environment");
    }

    // delete all mongodb collections
    try {
        await reset.dropMongoCollections();
    } catch (error) {
        logger.error("Error resetting MongoDB: " + error);
    }

    // delete all mysql databases
    try {
        await reset.dropMysqlDatabases();
    } catch (error) {
        logger.error("Error resetting MYSQL: " + error);
    }
})

/**
 * Run health check
 * ----------------
 * 
 * Checks services are available and subscribed to RabbitMQ
 */
commands.register('controlService.runHealthcheck', async () => {

    const services = [
        'userService',
        'contactService',
        'productService',
        'cartService',
        'orderService',
        'subscriptionService',
        'checkoutService'
    ]

    const results = await Promise.all(
        services.map(async (service) => {
            try {
                const result = await message.sendAwaitResponse(service, {
                    method: 'healthCheck'
                });
                return { service, result };
            } catch (error) {
                return {
                    service,
                    error: `Error checking health of ${service}: ${error}`
                };
            }
        })
    );

    const errors = results
        .filter(r => r.error)
        .map(r => r.error);

    // Check for failed tasks
    const failedTasks = await task.getTasksByStatus({
        status: 'failed'
    });

    if (failedTasks.length > 0) {
        errors.push(`${failedTasks.length} failed tasks`);
    }

    // Aggregate errors
    if (errors.length > 0) {
        throw new error.failedHealthCheck(JSON.stringify(errors));
    }

    logger.info('Health check passed');
    return;
})

/**
 * Internal health check (kills process if it fails)
 */
commands.register('controlService.internalHealthCheck', async () => {

    // ensure db connection
    try {
        await db.checkConnection();
    } catch (err) {
        logger.error('[Internal health check] Failed - Exiting. Error connecting to MYSQL: ' + err);
        process.exit(1);
    }
})
