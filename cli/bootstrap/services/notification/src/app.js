import { message, http, logger, db, registerService, webSockets, test } from '@gnar-engine/core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as notificationPlatformHttpController } from './controllers/http.controller.js';

/**
 * Initialise service
 */
export const initService = async () => {

	// Run migrations
    if (config.db.type == 'mysql') {
	    db.migrations.runMigrations({config});
    }

    // Run seeders
	db.seeders.runSeeders({config});

	// Import command handlers after the command bus is initialised
	await import('./commands/notification.handler.js');
	// Add more handlers as needed

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

	// Start the HTTP server
	await http.start();

	logger.info('G n a r  E n g i n e | Notification Service initialised successfully.');

    // Tests
    if (config.environment === 'test' && config.runTests) {
        test.runCommandTests({config});
    }
}

initService();
