import amqp from 'amqplib';

let rabbitConnectionUrl = '';
let rabbitConnection = null;
let rabbitChannel = null;

export const queueArgs = {
    arguments: {
        'x-queue-type': 'quorum',
    },
};

/**
 * Set RabbitMQ connection url
 */
export const setRabbitConnectionUrl = (url) => {
    rabbitConnectionUrl = url;
}

/**
 * Get RabbitMQ connection
 * 
 * @returns {Promise<import('amqplib').Connection>}
 */
export const getRabbitMQConnection = async () => {
    if (rabbitConnection) return rabbitConnection;

    try {
        console.log('Connecting to RabbitMQ:', rabbitConnectionUrl);
        rabbitConnection = await amqp.connect(rabbitConnectionUrl);
    } catch (error) {
        console.log('Error connecting to RabbitMQ:', error);
        rabbitConnection = null;
        await new Promise(resolve => setTimeout(resolve, 3000));
        return getRabbitMQConnection({rabbitConnectionUrl});
    }

    return rabbitConnection;
};

/**
 * Get rabbit MY channel
 * 
 * @returns {Promise<import('amqplib').Channel>}
 */
export const getRabbitMQChannel = async () => {
    if (rabbitChannel) return rabbitChannel;

    if (!rabbitConnection) {
        await getRabbitMQConnection();
    }

    try {
        rabbitChannel = await rabbitConnection.createChannel();
    } catch (error) {
        console.error('Error creating RabbitMQ channel:', error);
        rabbitChannel = null;
        await new Promise(resolve => setTimeout(resolve, 3000));
        return getRabbitMQChannel();
    }

    return rabbitChannel;
};

/**
 * Register consumer
 * 
 * @param {*} queueName 
 * @param {*} prefetchCount 
 * @param {*} onMessageCallback 
 * @returns {*} consumerTag
 */
export const registerConsumer = async (queueName, prefetchCount, onMessageCallback) => {
    const channel = await getRabbitMQChannel();

    // Assert the queue
    await channel.assertQueue(queueName, queueArgs);
    await channel.prefetch(prefetchCount);

    const consumer = await channel.consume(queueName, async (msg) => {
        if (msg) {
            (async () => {
                try {
                    await onMessageCallback(msg, channel);
                } catch (err) {
                    console.error('Error handling message:', err);
                    channel.nack(msg, false, false);
                }
            })();
        }
    });

    return consumer.consumerTag;
};

/**
 * 
 * @param {*} queueName 
 * @param {*} prefetchCount 
 * @param {*} onMessageCallback 
 * @param {*} previousConsumerTag 
 * @returns {*} consumerTag
 */
export const handleReconnection = async (queueName, prefetchCount, onMessageCallback, previousConsumerTag) => {
    // Reconnect to RabbitMQ and create a new channel
    await getRabbitMQConnection();
    await getRabbitMQChannel();

    // Reassert queue and prefetch
    const channel = await getRabbitMQChannel();
    await channel.assertQueue(queueName, queueArgs);
    await channel.prefetch(prefetchCount);

    // Cancel the previous consumer if it exists
    if (previousConsumerTag) {
        await channel.cancel(previousConsumerTag);
    }

    // Register a new consumer
    return registerConsumer(queueName, prefetchCount, onMessageCallback);
};

/**
 * Initialize RabbitMQ connection and register consumer
 * 
 * @param {*} queueName 
 * @param {*} prefetchCount 
 * @param {*} onMessageCallback 
 * @returns {*} consumerTag
 */
export const initializeRabbitMQ = async (queueName, prefetchCount, onMessageCallback) => {
    // Initialize the RabbitMQ connection and channel
    await getRabbitMQConnection();
    const channel = await getRabbitMQChannel();

    // Assert the queue exists and configure it with centralized queue args
    await channel.assertQueue(queueName, queueArgs);
    await channel.prefetch(prefetchCount);

    // Register consumer and handle reconnections
    const consumerTag = await registerConsumer(queueName, prefetchCount, onMessageCallback);

    // Handle connection close/reconnect
    rabbitConnection.on('close', async () => {
        console.log('RabbitMQ connection closed, attempting to reconnect...');
        await reinitializeRabbitMQ(queueName, prefetchCount, onMessageCallback, consumerTag);
    });

    console.log('RabbitMQ connection established and consumer registered:', consumerTag);

    return consumerTag;
};

/**
 * Reinitialize RabbitMQ connection and reregister consumer
 * 
 * @param {*} queueName 
 * @param {*} prefetchCount 
 * @param {*} onMessageCallback 
 * @param {*} previousConsumerTag 
 * @returns {*} consumerTag
 */
export const reinitializeRabbitMQ = async (queueName, prefetchCount, onMessageCallback, previousConsumerTag) => {
    console.log('Reconnecting to RabbitMQ...');
    
    // Reconnect to RabbitMQ and register a new consumer
    const consumerTag = handleReconnection(queueName, prefetchCount, onMessageCallback, previousConsumerTag);

    console.log('RabbitMQ connection re-established and consumer registered:', consumerTag);

    return consumerTag;
};
