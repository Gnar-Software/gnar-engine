import dotenv from 'dotenv';
import { logger } from './services/logger.service.js';
import { commandBus } from './commands/command-bus.js';
import { messageController } from './controllers/message.controller.js';
import { messageAwaitResponse } from '@gnar-engine/message-client';
import { internalHealthCheck } from './commands/handlers/control.handler.js';
import { sendNotification } from './commands/handlers/notification.handler.js';

dotenv.config({ path: '.env' });

process.on('unhandledRejection', (reason, promise) => {
	console.error('🚨 Unhandled Rejection at:', promise, '\nReason:', reason);
	process.exit(1);
});
  
process.on('uncaughtException', (err) => {
	console.error('🚨 Uncaught Exception:', err);
	process.exit(1);
});

/**
 * @function startServer
 * @description Initializes and starts the Fastify server.
 */
const startService = async () => {

	// Register commands
	commandBus.register('internalHealthCheck', internalHealthCheck);
	commandBus.register('sendNotification', sendNotification);

	// Init controllers and error handlers
	messageController.init();

	// Register with control service
	try {
		await messageAwaitResponse('controlService', {
			method: 'registerService',
			data: {
				service: {
					name: 'notificationService'
				}
			}
		});
	} catch (error) {
		logger.info('No response from the control service when registering as a service');
	}

};

// Entry point
startService();
