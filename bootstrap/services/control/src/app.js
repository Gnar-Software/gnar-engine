import { message, http, logger, db, registerService } from 'gnarengine-service-core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as controlPlatformHttpController } from './controllers/http.controller.js';


/**
 * Initialise service
 */
export const initService = async () => {

    // Run migrations
    db.migrations.runMigrations({config});

    // Import command handlers after the command bus is initialised
    await import('./commands/control.handler.js');
    await import('./commands/service.handler.js');
    await import('./commands/task.handler.js');

    // Initialise and register message handlers
    await message.init({
        config: config.message,
        handlers: messageHandlers
    });

    // Register http routes
    await http.registerRoutes({
        controllers: [
            controlPlatformHttpController,
        ]
    });

    // Start the HTTP server
    await http.start();

    // Register service with control service
    await registerService();

    logger.info('G n a r  E n g i n e | Control Service initialised successfully.');
}

initService();
