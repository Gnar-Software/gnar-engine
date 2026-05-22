import { message, http, logger, db, webSockets, test, manifest as commandManifest, commands } from '@gnar-engine/core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as userPlatformHttpController } from './controllers/http.controller.js';
import { userSchema } from './schema/user.schema.js';


/**
 * Initialise service
 */
export const initService = async () => {

	// Run migrations
	await db.migrations.runMigrations({config});
	await db.seeders.runSeeders({config});

	// Import command handlers after the command bus is initialised
	await import('./commands/user.handler.js');
	await import('./commands/session.handler.js');

	// Initialise and register message handlers
	await message.init({
		config: config.message,
		handlers: messageHandlers
	});

    // Initialise websocket client & server
    await webSockets.init(config.webSockets, config.serviceName);

    // Register http routes
	await http.registerRoutes({
		controllers: [
			userPlatformHttpController,
		]
	});

    // Register the command manifest after all commands are registered
    await commands.execute('controlService.registerManifest', {
        serviceName: config.serviceName,
        manifest: {
            ...commandManifest.manifest,
            schemas: {
                ...commandManifest.manifest.schemas,
                [userSchema.schemaName]: userSchema.schema
            }
        }
    });

	// Start the HTTP server
	await http.start();

	logger.info('G n a r  E n g i n e | User Service initialised successfully.');

    // Tests
    if (config.environment === 'test' && config.runTests) {
        test.runCommandTests({config});
    }
}

initService();
