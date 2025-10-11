import { loggerService } from "./logger.service.js";
import { db } from "../db/db.js";
import fs from 'fs';
import path from 'path';

/**
 * Run migrationss
 */
export const migrations = {

    config: null,

    // run migrations
    runMigrations: async ({config}) => {
        try {
            loggerService.info("Running migrations");
    
            migrations.config = config;

            // Get migration files
            const migrationsPath = process.env.GLOBAL_SERVICE_BASE_DIR + '/db/migrations';
            const files = (await fs.promises.readdir(migrationsPath)).sort();

            // Run migrations
            for (const migrationName of files) {
                const migrationFile = path.join(migrationsPath, migrationName);
                const migration = await import(migrationFile);
    
                if (!(await migrations.checkMigrationAlreadyRun(migrationName))) {
                    // Run migration
                    loggerService.info("Running migration: " + migrationName);
                    await migration.up();
    
                    // Mark migration as run
                    await migrations.markMigrationAsRun(migrationName);
                } else {
                    loggerService.info("Migration already run: " + migrationName);
                }
            }
    
            loggerService.info("Migrations completed successfully");
        } catch (error) {
            loggerService.error("Error running migrations: " + error);
            throw error;
        }
    },

    // check if migration already run
    checkMigrationAlreadyRun: async (migrationName) => {
        // check migration table exists
        const [migrationsTable] = await db.query('SHOW TABLES LIKE "migrations"');

        if (migrationsTable.length == 0) {
            return false;
        }

        if (migrationName == '01-init.js') {
            return true;
        }
    
        // check if migration already run
        const [migrations] = await db.query('SELECT * FROM migrations WHERE name = ?', [migrationName]);
        
        if (migrations.length == 0) {
            return false;
        }
    
        return true;
    },

    // mark migration as run
    markMigrationAsRun: async (migrationName) => {
        await db.execute('INSERT INTO migrations (name) VALUES (?)', [migrationName]);
    }
}