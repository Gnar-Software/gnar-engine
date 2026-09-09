import { loggerService } from '../services/logger.service.js';

if (process.env.NODE_ENV !== "development") {
	process.on("uncaughtException", async (error) => {
		loggerService.error("Uncaught Exception: " + error);

		// Once logs are shipped rather than written to stdout, the crash log exists only in
		// the in-memory buffer. Best effort: a failure draining it must not stop the exit.
		try {
			await loggerService.close();
		} catch (err) {
			console.error('[gnar-logger] flush on fatal error failed:', err);
		}

		process.exit(1);
	});

	process.on("unhandledRejection", async (reason, promise) => {
		loggerService.error("Unhandled Rejection at: " + promise + ". Reason: " + reason);

		// As above - drain the buffer so the reason the service died is not lost with it.
		try {
			await loggerService.close();
		} catch (err) {
			console.error('[gnar-logger] flush on fatal error failed:', err);
		}

		process.exit(1);
	});
}


/**
 * @param {Object} http - GnarEngine HTTP instance
 */
export const initErrorResponses = (http) => {
	http.setErrorHandler((error, request, reply) => {
		// Handle validation errors (e.g., Fastify schema validation)
		if (error.validation) {
            if (reply && typeof reply.send === 'function') {
                return reply.code(400).send({
                    statusCode: 400,
                    error: 'Bad Request',
                    message: error.message,
                });
            } else {
                throw new Error('Bad Request: ' + error.message);
            }
		}

		// Handle known business logic errors
		if (error instanceof NotFoundError) {
            if (reply && typeof reply.send === 'function') {
                return reply.code(404).send({
                    statusCode: 404,
                    error: 'Not Found',
                    message: error.message,
                });
            } else {
                throw new Error('Not found: ' + error.message);
            }
		}

		if (error instanceof BadRequestError) {
            if (reply && typeof reply.code === 'function' && typeof reply.send === 'function') {
                return reply.code(400).send({
                    statusCode: 400,
                    error: 'Bad Request',
                    message: error.message,
                });
            } else {
                throw new Error('Bad Request: ' + error.message);
            }
		}

		if (error instanceof UnauthorisedError) {
            if (reply) {
                return reply.code(401).send({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: error.message,
                });
            } else {
                throw new Error('Unauthorized: ' + error.message);
            }
		}

		// Handle rate limiting errors
		if (error.statusCode === 429) {
            if (reply) {
                return reply.code(429).send({
                    statusCode: 429,
                    error: 'Too Many Requests',
                    message: 'You have exceeded the request limit.',
                });
            } else {
                throw new Error('Too Many Requests: You have exceeded the request limit.');
            }
		}

		// Failed health check
		if (error instanceof FailedHealthCheckError) {
            if (!reply) {
                return reply.code(500).send({
                    statusCode: 500,
                    error: 'Failed Health Check',
                    message: error.message
                });
            } else {
                throw new Error('Failed Health Check: ' + error.message);
            }
		}

        // normalise
        if (!(error instanceof Error)) {
            error = new Error(typeof error === 'string' ? error : JSON.stringify(error));
        }

		// Log and handle 500 errors
		loggerService.error(error.stack || error.toString());

        if (reply) {
            return reply.code(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'Something went wrong',
                details: error?.message || error?.toString() || 'No additional error information available',
            });
        } else {
            throw new Error('Internal Server Error: ' + error.message);
        }
	});
};

// Custom error classes
export class NotFoundError extends Error {
	constructor(message = 'Resource not found') {
		super(message);
		this.name = 'NotFoundError';
		this.statusCode = 404;
	}
}

export class BadRequestError extends Error {
	constructor(message = 'Bad request') {
		super(message);
		this.name = 'BadRequestError';
		this.statusCode = 400;
	}
}

export class UnauthorisedError extends Error {
	constructor(message = 'Unauthorised') {
		super(message);
		this.name = 'UnauthorisedError';
		this.statusCode = 401;
	}
}

export class FailedHealthCheckError extends Error {
	constructor(message = 'Failed health check') {
		super(message);
		this.name = 'FailedHealthCheckError';
		this.statusCode = 500;
	}
}
