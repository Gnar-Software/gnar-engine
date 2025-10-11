import { commandBus } from '../commands/command-bus.js';
import { initializeRabbitMQ } from '../services/rabbit.js';
import { loggerService } from '../services/logger.service.js';

export const messageController = {
    routeHandlers: {},

    defaultHandlers: {
        runMigrations: async (payload) => {
            const migration = payload.data?.migration;
            await commandBus.execute('runMigrations', { migration });
        },

        runSeeders: async (payload) => {
            const seeder = payload.data?.seeder;
            await commandBus.execute('runSeeders', { seeder });
        },

        healthCheck: async () => {
            return { status: 'ok' };
        }
    },

    async init({ config, handlers = {} }) {
        if (!config?.queueName) {
            throw new Error('Queue name is required for message controller initialization');
        }

        // Merge default and custom handlers
        this.routeHandlers = { ...this.defaultHandlers, ...handlers };

        // Initialize the message queue
        await initializeRabbitMQ(
            config.queueName,
            config.prefetch || 20,
            this.handleMessage.bind(this)
        );
    },

    async handleMessage(msg, channel) { 
        if (!msg) return;

        let payload;
        try {
            payload = JSON.parse(msg.content.toString());
        } catch (error) {
            loggerService.error('Invalid JSON message received:', error);
            return channel.ack(msg);
        }

        let method = payload.method;

        if (method.includes('.')) {
            const parts = method.split('.');
            method = parts.slice(1).join('.');
        }

        const replyProps = { correlationId: msg.properties.correlationId };
        const handler = this.routeHandlers[method];

        if (!handler) {
            channel.sendToQueue(
                msg.properties.replyTo,
                Buffer.from(JSON.stringify({ error: 'Method not found' })),
                replyProps
            );
            return channel.ack(msg);
        }

        try {
            const result = await handler(payload, msg, channel);
            if (msg.properties.replyTo) {
                channel.sendToQueue(
                    msg.properties.replyTo,
                    Buffer.from(JSON.stringify(result ?? { ok: true })),
                    replyProps
                );
            }
        } catch (error) {
            if (msg.properties.replyTo) {
                channel.sendToQueue(
                    msg.properties.replyTo,
                    Buffer.from(JSON.stringify({ error: error.message })),
                    replyProps
                );
            }
        } finally {
            channel.ack(msg);
        }
    }
};