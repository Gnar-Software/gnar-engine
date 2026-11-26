import { message, http, logger, db, registerService, webSockets, test } from '@gnar-engine/core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as mcpPlatformHttpController } from './controllers/http.controller.js';
import { httpController as oauthHttpController } from './controllers/oauth.http.controller.js';

/**
 * Initialise service
 */
export const initService = async () => {

	// Run migrations
    if (config.db.type == 'mysql') {
	    db.migrations.runMigrations({config});
    }

	// Import command handlers after the command bus is initialised
	await import('./commands/mcp.handler.js');
	await import('./commands/oauth.handler.js');
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
			mcpPlatformHttpController,
			oauthHttpController,
		]
	});

	// Start the HTTP server
	await http.start();

	logger.info('G n a r  E n g i n e | Mcp Service initialised successfully.');

    // Tests
    if (config.environment === 'test' && config.runTests) {
        test.runCommandTests({config});
    }
}

initService();
