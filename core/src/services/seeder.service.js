import { loggerService } from "./logger.service.js";
import { db } from "../db/db.js";
import fs from 'fs';
import path from 'path';

/**
 * Run seeders
 */
export const seeders = {

    config: null,

    // run seeders
    runSeeders: async ({config}) => {
        try {
            loggerService.info("Running seeders");

            seeders.config = config;
            loggerService.info("Seeders config: " + JSON.stringify(seeders.config));

            // Get node env
            const nodeEnv = process.env.NODE_ENV || 'development';

            // Get seeder files
            let seedersPath;
            let files;

            try {
                seedersPath = process.env.GLOBAL_SERVICE_BASE_DIR + '/db/seeders/' + nodeEnv;
                files = (await fs.promises.readdir(seedersPath)).sort();

                if (files.length == 0) {
                    loggerService.info("No seeders found for environment: " + nodeEnv);
                    return;
                }
            } catch (err) {
                loggerService.info("No seeders found for environment: " + nodeEnv);
                return;
            }

            // Run seeders
            for (const seederName of files) {
                const seederFile = path.join(seedersPath, seederName);
                const seeder = await import(seederFile);

                if (!(await seeders.checkSeederAlreadyRun(seederName))) {
                    // Run seeder
                    try {
                        loggerService.info("Running seeder: " + seederName);
                        await seeder.up();

                        // Mark seeder as run
                        await seeders.markSeederAsRun(seederName);
                    } catch (err) {
                        loggerService.error("Error running seeder " + seederName + ": " + err);
                    }
                } else {
                    loggerService.info("Seeder already run: " + seederName);
                }
            }

            loggerService.info("Seeders completed successfully");
        } catch (error) {
            loggerService.error("Error running seeders: " + error);
            throw error;
        }
    },

    // check if seeder already run
    checkSeederAlreadyRun: async (seederName) => {

        let seedersRun = [];

        if (seeders.config.db.type == 'mysql') {
            // check seeders table exists
            const [seedersTable] = await db.query('SHOW TABLES LIKE "seeders"');

            if (seedersTable.length == 0) {
                return false;
            }

            // check if seeder already run
            const [seedersResult] = await db.query('SELECT * FROM seeders WHERE name = ?', [seederName]);

            seedersRun = seedersResult;
        } else {
            const collection = db.collection('seeders');
            seedersRun = await collection.find({ name: seederName }).toArray();
        }

        if (seedersRun.length == 0) {
            return false;
        }

        return true;
    },

    // mark seeder as run
    markSeederAsRun: async (seederName) => {
        if (seeders.config.db.type == 'mysql') {
            await db.execute('INSERT INTO seeders (name) VALUES (?)', [seederName]);
        } else {
            await db.collection('seeders').insertOne({ name: seederName, runAt: new Date() });
        }
    }
}
