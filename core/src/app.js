import { httpController } from './controllers/http.controller.js';
import { messageController } from './controllers/message.controller.js';
import { commandBus } from './commands/command-bus.js';
import { manifest as manifestObj } from './commands/command-manifest.js';
import { runSeeders, internalHealthCheck } from './commands/handlers/control.handler.js';
import { BadRequestError, initErrorResponses, NotFoundError, UnauthorisedError, FailedHealthCheckError } from './errors/errors.js';
import { initDbConnection, checkConnection, dropDatabaseData } from './db/db.js';
import { sqlHelpers } from './db/helpers.js';
import { decorators } from './utils/decorators.js';
import { migrations } from './services/migration.service.js';
import { seeders } from './services/seeder.service.js';
import { loggerService } from './services/logger.service.js';
import { httpTransport } from './drivers/transport/http.transport.js';
import { setRabbitConnectionUrl } from './services/rabbit.js';
import { messageAwaitResponse, messageAndForget } from './services/message.service.js';
import { wsManager } from './services/websocket.service.js';
import schemaService from './services/schema.service.js';
import { testService } from './services/test.service.js';
import { storageService } from './services/storage.service.js';
import { rabbit as rabbitService } from './services/rabbit.js';
import { v4 as uuidv4 } from 'uuid';
import { v5 as uuidv5 } from 'uuid';
import { CronExpressionParser } from 'cron-parser';
import bcrypt from 'bcrypt';

const configModule = await import(process.env.GLOBAL_SERVICE_BASE_DIR + 'config.js');
export const config = configModule.config;

/**
 * Gnar Engine
 * 
 * @module GnarEngine
 * @description Gnar Engine service core for building microservices and modular monoliths.
 * It provides a set of utilities and services to help developers create scalable and maintainable applications.
 */
const GnarEngine = {

	/**
	 * Initialise
	 */
	init: async (config) => {

        // Set config
        GnarEngine.config = config;

		// Initialise http server
        if (config.http && config.http.allowedMethods) {
            GnarEngine.http = httpController;
            await GnarEngine.http.init({ 
                config: config.http, 
                serviceName: config.serviceName 
            });
        }

		// Initialise command bus
		GnarEngine.commands = commandBus;
        GnarEngine.commands.init(config);
        GnarEngine.manifest = manifestObj;

		// Connect to database
        if (config.db && config.db.type) {
            try { 
                GnarEngine.db = await initDbConnection(config.db);
            } catch (err) {
                loggerService.error('Error connecting to database: ' + err);
                process.exit(1);
            }
        }

        // Db utilities
        if (!GnarEngine.db) {
            GnarEngine.db = {};
        }

        GnarEngine.db.checkConnection = checkConnection;
        GnarEngine.db.migrations = migrations;
        GnarEngine.db.seeders = seeders;

        sqlHelpers.init(GnarEngine.db);
        GnarEngine.db.sql = {};
        GnarEngine.db.sql.helpers = sqlHelpers;

		// On ready
        if (GnarEngine.http) {
            GnarEngine.http.addHook('onReady', async () => {
                // Internal health check
                setInterval(() => {
                    commandBus.execute('internalHealthCheck', { config });
                }, 60000);
            });
        }

		// Initialise errors
        if (GnarEngine.http) {
		    initErrorResponses(GnarEngine.http);
        }

		// Initialise message client
        setRabbitConnectionUrl(config.message?.url || '');
		GnarEngine.message = messageController;
		GnarEngine.message.sendAwaitResponse = messageAwaitResponse;
		GnarEngine.message.sendAndForget = messageAndForget;

        // Initialise websocket server
        GnarEngine.webSockets = wsManager;

		// Register core handlers
        GnarEngine.commands.register(`${config.serviceName}.runMigrations`, async () => await migrations.runMigrations({ config }));
		GnarEngine.commands.register(`${config.serviceName}.runSeeders`, async ({ seeder }) => await seeders.runSeeders({ config, seeder }));
		GnarEngine.commands.register(`${config.serviceName}.internalHealthCheck`, async () => await internalHealthCheck({ config }));
        GnarEngine.commands.register(`${config.serviceName}.dropDatabaseData`, dropDatabaseData);

		// Schema
		GnarEngine.schema = schemaService;

		// Logger
		// Aggregation activates from the environment rather than from service config, so an
		// existing service starts shipping logs on redeploy with no code change. A
		// config.cloud.logger block overrides the tuning values but does not switch it on;
		// anything left unset falls back to the defaults held by the logger and the transport.
		GnarEngine.logger = loggerService;

        // In export mode the host platform injects the endpoint, a token and the tenant
        // context. The core ships logs to whatever collector it is pointed at. Anything missing degrades to stdout
        // with a loud warning rather than throwing: a token that failed to mint must never
        // crash-loop a service, and the container's logs still show everything.
        const loggerTransports = [];
        const loggerIsExporting = process.env.GLOBAL_LOGGER_MODE === 'export';
        const loggerIsConfigured = process.env.GLOBAL_LOGGER_ENDPOINT
            && process.env.GLOBAL_LOGGER_TOKEN
            && process.env.ACCOUNT_ID
            && process.env.PROJECT_ID
            && process.env.ENVIRONMENT_NAME
            && process.env.SOURCE_TYPE;

        if (loggerIsExporting && loggerIsConfigured) {
            httpTransport.init({
                url: process.env.GLOBAL_LOGGER_ENDPOINT,
                token: process.env.GLOBAL_LOGGER_TOKEN,
                tokenHeader: 'X-Gnar-Logger-Token',
                timeoutMs: config.cloud?.logger?.timeoutMs,
                maxRetries: config.cloud?.logger?.maxRetries
            });

            loggerTransports.push(httpTransport);
        }

        if (loggerIsExporting && !loggerIsConfigured) {
            console.error('[gnar-logger] GLOBAL_LOGGER_MODE is export but the endpoint, token or tenant context is incomplete - falling back to stdout');
        }

        GnarEngine.logger.init({
            // The platform injects SERVICE_NAME from the deploy config, which is the name
            // tenants query their logs by.
            serviceName: process.env.SERVICE_NAME || config.serviceName,
            transports: loggerTransports,
            flushIntervalMs: config.cloud?.logger?.flushIntervalMs,
            batchSize: config.cloud?.logger?.batchSize,
            maxBatchBytes: config.cloud?.logger?.maxBatchBytes,
            maxBufferSize: config.cloud?.logger?.maxBufferSize,
            context: {
                accountId: process.env.ACCOUNT_ID,
                projectId: process.env.PROJECT_ID,
                environmentName: process.env.ENVIRONMENT_NAME,
                sourceType: process.env.SOURCE_TYPE,
                deploymentId: process.env.DEPLOYMENT_ID
            }
        });

		// Errors
		GnarEngine.error = {
			notFound: NotFoundError,
			badRequest: BadRequestError,
			unauthorised: UnauthorisedError,
			failedHealthCheck: FailedHealthCheckError
		}

		// Utils
        GnarEngine.utils = {
            uuid: () => uuidv4(),
            hash: async (password) => {
                return await bcrypt.hash(password, 10);
            },
            verifyHash: async (passwordAttempt, hash, hashNameSpace = '') => {
                // migrating to bcrypt hashes from uuidv5
                const isBcryptHash = typeof hash === 'string' && hash.startsWith('$2');

                if (isBcryptHash) {
                    return await bcrypt.compare(passwordAttempt, hash);
                }

                // fallback: uuidv5 legacy hashes
                else {
                    const uuidv5Hash = uuidv5(passwordAttempt, hashNameSpace);
                    return uuidv5Hash === hash;
                }

                return false;
            },
            cronExpressionParser: CronExpressionParser,
            decorators: decorators
        }

		// Global pre-handlers
        if (GnarEngine.http) {
            GnarEngine.http.addHook('onRequest', async (request, reply) => {
                const { url, method } = request;

                // Append trailing slash internally (no redirect)
                if (!url.endsWith('/') && !url.includes('.') && url !== '/') {
                    const parsedUrl = new URL(request.raw.url, `http://${request.headers.host}`);
                    parsedUrl.pathname += '/';
                    request.raw.url = parsedUrl.pathname + (parsedUrl.search || '');
                }

                // set authenticated user
                const authHeader = request.raw.headers.authorization || '';
                const token = authHeader ? authHeader.split(' ')[1] : '';
            
                if (token) {
                    // get authenticated user from authentication service
                    const userResult = await GnarEngine.commands.execute('userService.getAuthenticatedUser', {
                        token: token
                    })

                    if (userResult) {
                        request.user = userResult;
                    }
                }
            });
        }

		GnarEngine.registerService = async () => {
			if (config.serviceName !== 'controlService') {
				try {
					await GnarEngine.commands.execute('controlService.registerService', {
						service: {
							name: config.serviceName,
							manifest: manifest.manifest
						}
					});
				} catch (error) {
					GnarEngine.logger.error(`Failed to register service ${config.serviceName} with control service: ${error.message}`);
				}
			}
		}

        // Tests
        GnarEngine.test = testService;

        // Storage
        if (config.storage && config.storage.driver) {
            storageService.init(config.storage);
            GnarEngine.storage = storageService;
        } else {
            const storageError = () => {
                throw new Error('Storage service not configured - please configure storage in config.js')
            }
            GnarEngine.storage = {
                upload: storageError,
                download: storageError,
                getUrl: storageError
            }
        }
        
        // Rabbit
        GnarEngine.rabbit = rabbitService;

        // Export empty objects for unitialised services to avoid errors
        if (!GnarEngine.http) {
            GnarEngine.http = {};
        }
	}
}

await GnarEngine.init(config);

export default GnarEngine;
export const { commands, http, message, db, schema, logger, error, utils, registerService, webSockets, test, storage, rabbit, manifest } = GnarEngine;

// Exported so an application can wire the transport at its own collector by hand, rather than
// only through GLOBAL_LOGGER_MODE. Nothing in it is tied to a particular platform - the url,
// header name and token are all parameters.
export { httpTransport };
