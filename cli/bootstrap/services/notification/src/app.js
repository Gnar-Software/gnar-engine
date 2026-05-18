import { config } from './config.js';
import { registerBlocks } from './utils/blocks.js'
import { registerHelpers } from './utils/handlebarsHelpers.js';
import { messageHandlers } from './controllers/message.controller.js';
import { message, http, logger, db, webSockets, test } from '@gnar-engine/core';

import { httpController as templatesHttpController } from './controllers/templates.http.controller.js';
import { httpController as notificationPlatformHttpController } from './controllers/http.controller.js';

/**
 * Initialise service
 */
export const initService = async () => {

	// Run migrations & seeders
	await db.migrations.runMigrations({config});
	await db.seeders.runSeeders({config});

	// Import command handlers after the command bus is initialised
	await import('./commands/templates.handler.js');
	await import('./commands/notification.handler.js');
	await import('./commands/emailNotification.handler.js');
	await import('./commands/storedNotification.handler.js');

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
			templatesHttpController,
			notificationPlatformHttpController,
		]
	});

	// Start the HTTP server
	await http.start();

	// Register Handlebars blocks and helpers
	registerBlocks();
	registerHelpers();

	logger.info('G n a r  E n g i n e | Notification Service initialised successfully.');

    // Tests
    if (config.environment === 'test' && config.runTests) {
        test.runCommandTests({config});
    }
}

initService();
