import { commands, logger, message, db } from '@gnar-engine/core';
import { registry } from "../services/registry.service.js";
import { task } from "../services/task.service.js";
import { reset } from "../services/reset.service.js";
import { seeders } from "../services/seeders.service.js";


/**
 * Run seeders
 *
 * @param {Object} params
 * @param {string} params.seeder The seeder type (e.g. 'test', 'development')
 */
commands.register('controlService.runAllSeeders', async ({ seeder }) => {

    const services = await registry.getServices();

    // delete all collections
    await seeders.runAll({
        services: services,
        seeder: seeder
    });
})

/**
 * Run full database reset (centrally)
 */
commands.register('controlService.runReset', async () => {

    const services = await registry.getServices();

    // delete all collections
    await reset.allServiceDatabases({
        services: services
    });
})

