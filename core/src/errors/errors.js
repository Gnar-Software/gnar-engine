import { loggerService } from '../services/logger.service.js';

if (process.env.NODE_ENV !== "development") {
	process.on("uncaughtException", (error) => {
		loggerService.error("Uncaught Exception: " + error);
		process.exit(1);
	});

	process.on("unhandledRejection", (reason, promise) => {
		loggerService.error("Unhandled Rejection at: " + promise + ". Reason: " + reason);
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
			return reply.code(400).send({
				statusCode: 400,
				error: 'Bad Request',
				message: error.message,
			});
		}

		// Handle known business logic errors
		if (error instanceof NotFoundError) {
			return reply.code(404).send({
				statusCode: 404,
				error: 'Not Found',
				message: error.message,
			});
		}

		if (error instanceof BadRequestError) {
			return reply.code(400).send({
				statusCode: 400,
				error: 'Bad Request',
				message: error.message,
			});
		}

		if (error instanceof UnauthorisedError) {
			return reply.code(401).send({
				statusCode: 401,
				error: 'Unauthorized',
				message: error.message,
			});
		}

		// Handle rate limiting errors
		if (error.statusCode === 429) {
			return reply.code(429).send({
				statusCode: 429,
				error: 'Too Many Requests',
				message: 'You have exceeded the request limit.',
			});
		}

		// Failed health check
		if (error instanceof FailedHealthCheckError) {
			return reply.code(500).send({
				statusCode: 500,
				error: 'Failed Health Check',
				message: error.message
			});
		}

		// Log and handle 500 errors
		loggerService.error(error);

		return reply.code(500).send({
			statusCode: 500,
			error: 'Internal Server Error',
			message: 'Something went wrong',
			details: process.env.NODE_ENV === 'development' ? error.stack : '',
		});
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