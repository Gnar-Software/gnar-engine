import WebSocket, { WebSocketServer } from 'ws';
import { loggerService } from '../services/logger.service.js';
import { commandBus } from '../commands/command-bus.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * P2P WebSocket Manager
 */
export const wsManager = {

    // serviceName -> WebSocket
    wsMap: new Map(),

    // { messageId, resolve, reject, timeout }
    pendingCalls: [],

    async init(config, serviceName) {
        
        config.serviceName = serviceName;

        // Start the server
        this.startServer();

        // Initial connection to control service 
        let attempt = 1;

        while (true) { 
            try { 
                if (config.serviceName !== 'controlService') {
                    loggerService.info('serviceName ' + JSON.stringify(config));
                    await this.connect('controlService', config); 
                }
                break;
            } catch (err) { 
                if (attempt >= config.maxInitialConnectionAttempts) { 
                    loggerService.error(`Initial WS connection to control service failed after ${attempt} attempts. Exiting.`);
                    process.exit(1);
                } else { 
                    loggerService.error(`Initial WS connection to control service failed (attempt ${attempt}). Retrying in 3s...`); 
                    attempt++; 
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }

        // poll connection to other services
        setInterval(async () => {

            let services = [];

            // Get services from service registry let services = [];
            try {
                services = await commandBus.execute('controlService.getServices', {});
            } catch (err) {
                loggerService.error('Failed to get service registry. ' + err);
                return;
            }

            // Connect to any services not already Connected
            const connectionPromises = services.map(service => {
                if (service.name === config.serviceName) {
                    return Promise.resolve();
                }

                if (this.wsMap[service.name] && this.wsMap[service.name].readyState === WebSocket.OPEN) {
                    return Promise.resolve();
                }

                return this.connect(service.name, config)
            });

            try {
                await Promise.all(connectionPromises);
            } catch (err) {
                loggerService.error('Failed to connect to some services', err);
                throw err;
            }
        },

        config.reconnectInterval || 10000);
    },

    /**
     * Start server to accept inbound connections
     *
     * @param {number} port - Port to listen on
     */
    startServer(port = 5000) {
        const wss = new WebSocketServer({ port });
        loggerService.info(`WS Server listening on port ${port}`);

        wss.on('connection', (ws, req) => {
            const serviceName = this.identifyPeer(req);
            loggerService.info(`Inbound connection from ${serviceName}`);
            this.wsMap.set(serviceName, ws);

            ws.on('message', (raw) => {
                this.handleMessage(serviceName, raw);
            });

            ws.on('close', () => {
                loggerService.info(`Peer disconnected: ${serviceName}`);
                this.wsMap.delete(serviceName);
            });
        });
    },

    /**
     * Connect to a peer (outbound)
     *
     * @param {string} serviceName - Unique name of the peer service
     * @param {Object} config - Configuration object
     * @returns {Promise<WebSocket>} - Resolves to the connected WebSocket
     */
    async connect(serviceName, config) {
        const serviceHostname = serviceName.replace('Service', '-service').toLowerCase();
        const url = `ws://${serviceHostname}:5000`;

        // check to ensure we don't already have a connection
        if (this.wsMap.has(serviceName) && this.wsMap.get(serviceName).readyState === WebSocket.OPEN) {
            return this.wsMap.get(serviceName);
        }

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(url, {
                headers: {
                    'x-api-key': 'my-secret-key',
                    'x-service-name': config.serviceName
                }
            });

            ws.on('open', () => {
                loggerService.info(`Connected to peer ${serviceName} at ${url}`);
                this.wsMap.set(serviceName, ws);

                ws.on('message', (raw) => {
                    this.handleMessage(serviceName, raw);
                });

                ws.on('close', () => {
                    loggerService.info(`Peer disconnected: ${serviceName}`);
                    this.wsMap.delete(serviceName);
                });
                resolve(ws);
            });

            ws.on('error', err => {
                loggerService.error(`Failed to connect to peer ${serviceName} at ${url}`, err);
                reject(err);
            });
        });
    },

    /**
     * Handle inbound message
     *
     * @param {string} serviceName - Name of the peer service
     * @param {string} raw - Raw message data
     */
    async handleMessage(serviceName, raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch (err) {
            loggerService.error('Invalid JSON from peer:', raw);
            return;
        }

        // request from peer
        if (msg.type === 'request' && msg.commandName) {
            try {
                const result = await commandBus.execute(msg.commandName, msg.payload);
                this.sendResponse(serviceName, msg.messageId, result);
            } catch (err) {
                this.sendResponse(serviceName, msg.messageId, null, err.message);
            }
        }

        // response to a previous request
        else if (msg.type === 'response') {
            const i = this.pendingCalls.findIndex(c => c.messageId === msg.messageId);
            if (i === -1) {
                loggerService.error(`No pending call for messageId ${msg.messageId}`);
                return;
            }
            const call = this.pendingCalls.splice(i, 1)[0];
            clearTimeout(call.timeout);

            if (msg.error) {
                call.reject(new Error(msg.error));
            } else {
                call.resolve(msg.response);
            }
        }

        // unknown message type
        else {
            loggerService.error('Unknown message type', msg);
        }
    },

    /**
     * Send a request and wait for response
     */
    async send(serviceName, commandName, payload, timeoutMs = 10000) {
        const ws = this.wsMap.get(serviceName);

        if (!ws || ws.readyState !== WebSocket.OPEN) {
            throw new Error(`WebSocket not connected to ${serviceName}`);
        }

        const messageId = uuidv4();
        const msg = { type: 'request', messageId, commandName, payload };
        
        ws.send(JSON.stringify(msg));

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingCalls = this.pendingCalls.filter(c => c.messageId !== messageId);
                reject(new Error(`Timeout waiting for response from ${serviceName}`));
                loggerService.error(`Timeout waiting for response on call: ${JSON.stringify(msg)}`);
            }, timeoutMs);

            this.pendingCalls.push({ messageId, resolve, reject, timeout });
        });
    },

    /**
     * Send a response to a peer
     */
    sendResponse(serviceName, messageId, response = null, error = null) {
        const ws = this.wsMap.get(serviceName);

        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return;
        }

        ws.send(JSON.stringify({ type: 'response', messageId, response, error }));
    },

    /**
     * Identify peer from connection request
     */
    identifyPeer(req) {
        return req.headers['x-service-name'] || `unknown-${Date.now()}`;
    }
};

