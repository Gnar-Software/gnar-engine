# Gnar Engine - Service Core / Base Image

The Gnar Engine Service Core bootstraps:

- Fastify Web Server
- AJV schema validation
- A command bus providing a single abstraction layer for executing functions within or between services
- Inter service messaging (Rabbit MQ)
- Logging
- Errors
- Database initialisation
- Handling for seeders & migrations
- Health checks


### message controller example implementation

``` javascript
    import { messageController } from './controllers/message-controller.js';

    await messageController.init({
        config: {
            queueName: 'userServiceQueue',
            prefetch: 20
        },
        handlers: {
            customJob: async (payload) => {
                console.log('Handling customJob:', payload);
                return { received: true };
            }
        }
    });
```