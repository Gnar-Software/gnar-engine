import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { loggerService } from '../services/logger.service.js';

let http = null;
let port = 3000;

export const httpController = {

    init: (config) => {
        http = Fastify({});
        port = config.port || 3000;

        // cors
        http.register(cors, {
            origin: config.allowedOrigins || [],
            methods: config.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: config.allowedHeaders || ['Content-Type', 'Authorization'],
            preflight: true,
            optionsSuccessStatus: 204,
            credentials: true
        });

        // Rate limiting
        if (config?.rateLimiting?.max && config?.rateLimiting?.timeWindow) {
            http.register(rateLimit, config.rateLimiting);
        }
    },

    registerRoutes: ({controllers}) => {
        controllers.forEach(controller => {
            Object.values(controller).forEach(route => {
                http.route(route);
            });
        });

        loggerService.info('Control service registered http routes ' + http.printRoutes());
    },

    addHook: (hookName, hookFunction) => {
        http.addHook(hookName, hookFunction);
    },

    start: async () => {
        try {
            await http.listen({ port: port, host: '0.0.0.0' });
            loggerService.info(`HTTP server started on port ${port}`);
        } catch (err) {
            loggerService.error('Error starting HTTP server: ' + err);
            process.exit(1);
        }
    },

    setErrorHandler: (errorHandler) => {
        http.setErrorHandler(errorHandler);
    },
}