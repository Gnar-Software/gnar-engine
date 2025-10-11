import { seeders } from "../../services/seeder.service.js";
import { initDbConnection } from "../../db/db.js";
import { loggerService } from "../../services/logger.service.js";

/**
 * Run seeders
 * 
 * @param {Object} params
 * @param {string} params.seeder Name of single seeder to run (optional)
 */
export const runSeeders = async ({seeder}) => {
    seeders.runSeeders();
}

/**
 * Internal health check (kills process if it fails)
 */
export const internalHealthCheck = async () => {

    // ensure db connection
    try {
        await initDbConnection();
    } catch (err) {
        loggerService.error('[Internal health check] Failed - Exiting. Error connecting to MongoDB: ' + err);
        process.exit(1);
    }
}