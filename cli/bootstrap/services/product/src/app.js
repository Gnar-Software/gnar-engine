import { message, http, logger, db } from '@gnar-engine/core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as productPlatformHttpController } from './controllers/http.controller.js';

/**
 * Initialise service
 */
export const initService = async () => {

	// Run migrations
	db.migrations.runMigrations({config});
	db.seeders.runSeeders({config});

	// Import command handlers after the command bus is initialised
	await import('./commands/product.handler.js');
	// Add more handlers as needed

	// Initialise and register message handlers
	await message.init({
		config: config.message,
		handlers: messageHandlers
	});

	// Register http routes
	await http.registerRoutes({
		controllers: [
			productPlatformHttpController,
		]
	});

	// Start the HTTP server
	await http.start();

	logger.info('G n a r  E n g i n e | Product Service initialised successfully.');
}

initService();
