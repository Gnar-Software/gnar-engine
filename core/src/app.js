import { httpController } from './controllers/http.controller.js';
import { messageController } from './controllers/message.controller.js';
import { commandBus } from './commands/command-bus.js';
import { manifest } from './commands/command-manifest.js';
import { runSeeders, internalHealthCheck } from './commands/handlers/control.handler.js';
import { BadRequestError, initErrorResponses, NotFoundError, UnauthorisedError, FailedHealthCheckError } from './errors/errors.js';
import { initDbConnection, checkConnection, dropDatabaseData } from './db/db.js';
import { sqlHelpers } from './db/helpers.js';
import { decorators } from './utils/decorators.js';
import { migrations } from './services/migration.service.js';
import { seeders } from './services/seeder.service.js';
import { loggerService } from './services/logger.service.js';
import { setRabbitConnectionUrl } from './services/rabbit.js';
import { messageAwaitResponse, messageAndForget } from './services/message.service.js';
import { wsManager } from './services/websocket.service.js';
import schemaService from './services/schema.service.js';
import { testService } from './services/test.service.js';
import { storageService } from './services/storage.service.js';
import { manifest } from './commands/command-manifest.js';
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
        GnarEngine.manifest = manifest;

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
		GnarEngine.logger = loggerService;
        GnarEngine.logger.init({
            cloudProjectId: config.cloud?.projectId || '',
            serviceName: config.serviceName,
            flushIntervalMs: config.cloud?.logger.flushIntervalMs || 5000,
            transports: config.cloud?.logger || []
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
