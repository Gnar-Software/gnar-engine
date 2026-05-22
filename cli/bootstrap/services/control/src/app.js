import { message, http, logger, db, webSockets, commands } from '@gnar-engine/core';
import { config } from './config.js';
import { messageHandlers } from './controllers/message.controller.js';
import { httpController as controlPlatformHttpController } from './controllers/http.controller.js';


/**
 * Initialise service
 */
export const initService = async () => {

    // Import command handlers after the command bus is initialised
    await import('./commands/control.handler.js');
    await import('./commands/service.handler.js');
    await import('./commands/task.handler.js');
    await import('./commands/recurringtask.handler.js');

    // Initialise and register message handlers
    await message.init({
        config: config.message,
        handlers: messageHandlers
    });

    // Run migrations
    await db.migrations.runMigrations({config});

    // Initialise websocket client & server
    await webSockets.init(config.webSockets, config.serviceName);

    // Control service replica tidy up
    setInterval(async () => {
        await commands.execute('controlService.removeDisconnectedReplicas');
    }, 1000); // every second

    // Process tasks
    setInterval(async () => {
        await commands.execute('controlService.handleTaskBatch');
    }, 5000); // every 5 seconds

    // Schedule tasks from recurring tasks
    setInterval(async () => {
        await commands.execute('controlService.scheduleFromRecurringTasks');
    }, 60000); // every minute

    // Register http routes
    await http.registerRoutes({
        controllers: [
            controlPlatformHttpController,
        ]
    });

    // wait for 5 seconds to allow inbound connections before doing anything else
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Start the HTTP server
    await http.start();

    logger.info('G n a r  E n g i n e | Control Service initialised successfully.');
}

initService();
