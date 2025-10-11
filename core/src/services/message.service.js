import { getRabbitMQChannel } from './rabbit.js';

export * from './rabbit.js';

export const messageAwaitResponse = async (service, payload) => {
    const queueName = `${service}Queue`;
    let channel;
    
    try {
        channel = await getRabbitMQChannel();
        await channel.assertQueue(queueName, {
            arguments: {
                'x-queue-type': 'quorum'
            },
        });
        
        const correlationId = generateCorrelationId();
        const consumerTag = correlationId;
        const responseQueue = await channel.assertQueue('', { exclusive: true });

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error(`No response from ${service} service`));
            }, 5000);

            const cleanup = () => {
                channel.cancel(consumerTag).catch(() => {});
                channel.deleteQueue(responseQueue.queue).catch(() => {});
                clearTimeout(timeout);
            };

            channel.consume(responseQueue.queue, (msg) => {
                if (msg.properties.correlationId === correlationId) {
                    cleanup();
                    resolve(JSON.parse(msg.content.toString()));
                    channel.ack(msg);
                }
            }, { noAck: false, consumerTag }).catch(reject);

            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), {
                replyTo: responseQueue.queue,
                correlationId: correlationId
            });
        });
    } catch (error) {
        if (channel) {
            try {
                await channel.close();
            } catch (err) {
                console.error('Failed to close channel:', err);
            }
        }
        throw new Error(`Failed to send message to ${service}: ${error.message}`);
    }
};

export const messageAndForget = async (service, payload) => {
    const queueName = `${service}Queue`;
    let channel;

    try {
        channel = await getRabbitMQChannel();
        await channel.assertQueue(queueName, {
            arguments: {
                'x-queue-type': 'quorum'
            },
        });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)));
    } catch (error) {
        if (channel) {
            try {
                await channel.close();
            } catch (err) {
                console.error('Failed to close channel:', err);
            }
        }
        throw new Error(`Failed to send message to ${service}: ${error.message}`);
    }

}

const generateCorrelationId = () => {
    return Math.random().toString(36).substring(7);
};