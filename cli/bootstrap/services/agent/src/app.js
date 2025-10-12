import { message, http, logger, db, registerService } from '@gnar-engine/core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as AgentPlatformHttpController } from './controllers/http.controller.js';
import { manifestService } from './services/manifest.service.js';
import { Agent } from './services/agent.service.js';

/**
 * Initialise service
 */
export const initService = async () => {

	// Run migrations
	db.migrations.runMigrations({config});
	db.seeders.runSeeders({config});

	// Import command handlers after the command bus is initialised
	await import('./commands/agent.handler.js');
	// Add more handlers as needed

	// Initialise and register message handlers
	await message.init({
		config: config.message,
		handlers: messageHandlers
	});

	// Register http routes
	await http.registerRoutes({
		controllers: [
			AgentPlatformHttpController,
		]
	});

    // Initialise agent client
    await Agent.init();

	// Start the HTTP server
	await http.start();

	// Register service with control service
    await registerService();

	// Start manifest generation poll
	//setInterval(() => {
		manifestService.generateServiceManifests();
	//}, 3600);

	logger.info('G n a r  E n g i n e | Agent Service initialised successfully.');
}

initService();

