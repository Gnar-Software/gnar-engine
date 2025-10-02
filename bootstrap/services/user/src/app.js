import { message, http, logger, db, registerService, webSockets } from 'gnarengine-service-core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as userPlatformHttpController } from './controllers/http.controller.js';


/**
 * Initialise service
 */
export const initService = async () => {

	// Run migrations
	await db.migrations.runMigrations({config});
	db.seeders.runSeeders({config});

	// Import command handlers after the command bus is initialised
	await import('./commands/user.handler.js');
	await import('./commands/session.handler.js');

	// Initialise and register message handlers
	await message.init({
		config: config.message,
		handlers: messageHandlers
	});

    // Initialise websocket client & server
    await webSockets.server.init(config.webSockets);
    await webSockets.client.init(config.webSockets);

	// Register http routes
	await http.registerRoutes({
		controllers: [
			userPlatformHttpController,
		]
	});

	// Start the HTTP server
	await http.start();

	// Register service with control service
    await registerService();

	logger.info('G n a r  E n g i n e | User Service initialised successfully.');
}

initService();
