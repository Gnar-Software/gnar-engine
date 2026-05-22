import { message, http, logger, db, registerService, webSockets, test } from '@gnar-engine/core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as pagePlatformHttpController } from './controllers/page.http.controller.js';
import { httpController as blockPlatformHttpController } from './controllers/block.http.controller.js';

/**
 * Initialise service
 */
export const initService = async () => {

    // Run seeders
	db.seeders.runSeeders({config});

	// Import command handlers after the command bus is initialised
	await import('./commands/page.handler.js');
    await import('./commands/block.handler.js');

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
			pagePlatformHttpController,
            blockPlatformHttpController
		]
	});

	// Start the HTTP server
	await http.start();

	logger.info('G n a r  E n g i n e | Page Service initialised successfully.');

    // Tests
    if (config.environment === 'test' && config.runTests) {
        test.runCommandTests({config});
    }
}

initService();
