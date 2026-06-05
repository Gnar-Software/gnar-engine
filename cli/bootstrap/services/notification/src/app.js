import { message, http, logger, db, webSockets, test, manifest as commandManifest, commands } from '@gnar-engine/core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as notificationPlatformHttpController } from './controllers/http.controller.js';
import { sesService } from './services/ses.service.js';

/**
 * Initialise service
 */
export const initService = async () => {

	// Run migrations
    if (config.db.type == 'mysql') {
	    await db.migrations.runMigrations({config});
    }

    // Run seeders
	await db.seeders.runSeeders({config});

	// Import command handlers after the command bus is initialised
	await import('./commands/notification.handler.js');
	await import('./commands/emailNotification.handler.js');
	await import('./commands/storedNotification.handler.js');

    // Initialise email transport
    sesService.init();

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
			notificationPlatformHttpController,
		]
	});

    // Register the command manifest after all commands are registered
    await commands.execute('controlService.registerManifest', {
        serviceName: config.serviceName,
        manifest: {
            description: config.serviceManifest.description,
            ...commandManifest.manifest
        }
    });

	// Start the HTTP server
	await http.start();

	logger.info('G n a r  E n g i n e | Notification Service initialised successfully.');

    // Tests
    if (config.environment === 'test' && config.runTests) {
        test.runCommandTests({config});
    }
}

initService();
