import { message, http, logger, db, webSockets, test, manifest as commandManifest, commands } from '@gnar-engine/core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as pagePlatformHttpController } from './controllers/page.http.controller.js';
import { httpController as blockPlatformHttpController } from './controllers/block.http.controller.js';
import { pageSchema, blockSchema, textInputSchema, richTextSchema, imageSchema, repeaterSchema } from './schema/page.schema.js';

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

    // Register the command manifest after all commands are registered
    await commands.execute('controlService.registerManifest', {
        serviceName: config.serviceName,
        manifest: {
            description: config.serviceManifest.description,
            ...commandManifest.manifest,
            schemas: {
                ...commandManifest.manifest.schemas,
                [pageSchema.schemaName]: pageSchema.schema,
                [blockSchema.schemaName]: blockSchema.schema,
                [textInputSchema.schemaName]: textInputSchema.schema,
                [richTextSchema.schemaName]: richTextSchema.schema,
                [imageSchema.schemaName]: imageSchema.schema,
                [repeaterSchema.schemaName]: repeaterSchema.schema
            }
        }
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
