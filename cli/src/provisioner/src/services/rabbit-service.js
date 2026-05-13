

export const rabbitService = {

    maxRetries: 10,

    assertConnection: async (rabbitUrl) => {
        const amqp = await import('amqplib');
        let retries = 0;

        while (retries < rabbitService.maxRetries) {
            try {
                const connection = await amqp.connect(rabbitUrl);
                await connection.close();
                console.log('Successfully connected to RabbitMQ message queue.');
                return;
            } catch (error) {
                console.log('Waiting for RabbitMQ to be ready...');
                retries++;

                if (retries >= rabbitService.maxRetries) {
                    throw new Error('Max retries reached. Could not connect to RabbitMQ message queue.');
                }

                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        }
    }
}
