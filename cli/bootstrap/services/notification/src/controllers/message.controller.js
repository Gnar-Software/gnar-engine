import { commandBus } from '../commands/command-bus.js';
import { logger } from '../services/logger.service.js';
import { initializeRabbitMQ } from '@gnar-engine/message-client';

// Configuration
const queueName = 'notificationServiceQueue';
const prefetch = 3;

export const messageController = {
    handleMessage: async function (msg, channel) {
        if (!msg) return;

        const payload = JSON.parse(msg.content.toString());

        if (!payload.method) {
            return channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify({ error: 'Method not found' })), {
                correlationId: msg.properties.correlationId,
            });
        }

        switch (payload.method) {
            case 'sendNotification':
                try {
                    const { templateName, to, params, subject } = payload.data;
                    await commandBus.execute('sendNotification', { templateName, to, params, subject });
                    channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify({ status: 'ok' })), {
                        correlationId: msg.properties.correlationId,
                    });
                } catch (error) {
                    logger.error("Error sending notification: " + error);
                    channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify({ error: 'Failed to send notification' })), {
                        correlationId: msg.properties.correlationId,
                    });
                } finally {
                    channel.ack(msg);
                }
                break;

            case 'healthCheck':
                await this.handleHealthCheck(msg, channel);
                break;

            default:
                await this.handleMethodNotFound(msg, channel);
        }
    },

    // Handler for the health check method
    async handleHealthCheck(msg, channel) {
        try {
            channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify({ status: 'ok' })), {
                correlationId: msg.properties.correlationId,
            });
        } catch (error) {
            logger.error("Error running health check:", error);
        } finally {
            channel.ack(msg);
        }
    },

    // Handler for unknown methods
    async handleMethodNotFound(msg, channel) {
        try {
            channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify({ error: 'Method not found' })), {
                correlationId: msg.properties.correlationId,
            });
        } catch (error) {
            logger.error("Error handling method not found:", error);
        } finally {
            channel.ack(msg);
        }
    },

    // Initialize RabbitMQ and consumers
    init: async function () {
        await initializeRabbitMQ(
            queueName,
            prefetch,
            this.handleMessage.bind(this)
        );
    },
}
