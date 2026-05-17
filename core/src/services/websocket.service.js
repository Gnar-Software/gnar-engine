import WebSocket, { WebSocketServer } from 'ws';
import { loggerService } from '../services/logger.service.js';
import { commandBus } from '../commands/command-bus.js';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

/**
 * P2P WebSocket Manager
 */
export const wsManager = {

    // websocket map: { [serviceName]: { [hostname]: WebSocket } }
    wsConnections: {},

    // { messageId, resolve, reject, timeout }
    pendingCalls: [],

    async init(config, serviceName) {

        const hostname = os.hostname();

        config.serviceName = serviceName;
        config.replicaSlot = hostname.split('.')[1];
        config.replicaId = hostname.split('.')[2];
        config.hostname = hostname;
        config.ip = (await os.networkInterfaces()['eth0'].find(i => i.family === 'IPv4')).address;

        // Start the server to accept inbound connections
        this.startServer(config);

        // connect to the control service and reconnect if connection drops
        if (config.serviceName !== 'controlService') {
            let ws;
            let peerAddresses = {};

            // await the initial connection
            while (!ws) {
                try {
                    ws = await this.connectToControlService(config);
                } catch (err) {
                    loggerService.error('Failed to connect to control service, retrying...', err.message);
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            // background reconnect loop
            (async () => {
                while (true) {
                    // wait until ws closes
                    await new Promise(resolve => ws.once('close', resolve));

                    let newWs;
                    while (!newWs) {
                        try {
                            newWs = await this.connectToControlService(config);

                            setTimeout(async () => {
                                await commandBus.execute('controlService.registerServiceAndReplica', {
                                    serviceName: config.serviceName,
                                    replicaSlot: config.replicaSlot, 
                                    replicaHostname: config.hostname,
                                    replicaIp: config.ip
                                });
                            }, 1000);
                        } catch (err) {
                            loggerService.error('Failed to reconnect to control service, retrying...', err.message);
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }

                    ws = newWs;
                }
            })();

            // register with control service
            try {
                loggerService.info('registering with', config.serviceName, config.replicaSlot, config.hostname, config.ip);
                await commandBus.execute('controlService.registerServiceAndReplica', {
                    serviceName: config.serviceName,
                    replicaSlot: config.replicaSlot, 
                    replicaHostname: config.hostname,
                    replicaIp: config.ip
                });
            } catch (error) {
                loggerService.error(`Failed to register service ${config.serviceName} with control service: ${error.message}`);
                throw error;
            }

            // get peers
            try {
                peerAddresses = await commandBus.execute('controlService.newPeerSet', {
                    requestingHostname: config.hostname
                });
                loggerService.info('Peers', peerAddresses);
            } catch (error) {
                loggerService.error('Failed to get peer set. ' + error.message);
                throw error;
            }

            // Setup our local connection map and connect for the first time
            if (peerAddresses && Object.keys(peerAddresses).length > 0) {
                await Promise.all(
                    Object.entries(peerAddresses).map(async ([serviceName, peer]) => {

                        // peer address can be empty if the control service doesn't have a replica for it ready yet
                        if (!peer || peer?.serviceName === config.serviceName) {
                            return;
                        }

                        await this.connect({ peer, config });
                    })
                );

                // get more peers in the event we are missing some from the initial start up
                let haveAllPeers = false;

                while (!haveAllPeers) {
                    // Wait 1 second before trying
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    loggerService.info('Checking for missing peer connections...');

                    for (const [serviceName, peer] of Object.entries(peerAddresses)) {
                        if (peer.hostname || serviceName == config.serviceName || (this.wsConnections[serviceName] && Object.keys(this.wsConnections[serviceName]).length > 0)) {
                            continue;
                        }

                        try {
                            loggerService.info('Missing ' + serviceName + ' peer connection - requesting new peer from control service.', serviceName + ' / ', config.serviceName);
                            const newPeer = await commandBus.execute('controlService.newPeerForService', {
                                requestingHostname: config.hostname,
                                serviceName: serviceName
                            });

                            if (!newPeer) {
                                continue;
                            }

                            peerAddresses[serviceName] = newPeer;

                            await this.connect({ peer: newPeer, config });
                        } catch (err) {
                            loggerService.error(`Failed to get and connect to new peer for ${serviceName}: ${err.message}`);
                        }
                    }

                    // Check if we now have all peers
                    const checkedAllPeers = Object.entries(peerAddresses).every(([serviceName, peer]) => {
                        if (peer.hostname || serviceName == config.serviceName || (this.wsConnections[serviceName] && Object.keys(this.wsConnections[serviceName]).length > 0)) {
                            return true;
                        } else if (!peer.hostname) {
                            // return true, because we're never going to find it from this side
                            loggerService.error('Peer information is missing for failed connection. This can occur if a service is down for a prolonged period. This service will now wait for an inbound connection.');
                            return true;
                        } else {
                            loggerService.info(`Still missing peer connection for ${serviceName}, due to ${peer}`);
                        }
                    });

                    if (checkedAllPeers) {
                        haveAllPeers = true;
                        break;
                    }

                }

                loggerService.info(`Initial peer connections established to: `, Object.keys(peerAddresses));
            }
        }

        // keep alives
        setInterval(() => {
            Object.values(this.wsConnections).forEach(service => {
                Object.values(service).forEach(ws => {
                    // send keep alive pings
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.ping();
                    }

                    // check for most recent pong
                    if ((ws.lastPong && Date.now() - ws.lastPong > 30000)) {
                        loggerService.warning('No pong received, terminating connection');
                        ws.terminate();
                    }
                });
            });
        }, 10000);
    },

    /**
     * Start server to accept inbound connections
     *
     * @param {number} port - Port to listen on
     */
    startServer(config, port = 5000) {
        const wss = new WebSocketServer({ port });

        wss.on('connection', (ws, req) => {
            const { serviceName, serviceHostname } = this.identifyPeer(req);

            // Otherwise store the new connection
            if (!this.wsConnections[serviceName]) {
                this.wsConnections[serviceName] = {};
            }

            this.wsConnections[serviceName][serviceHostname] = ws;

            loggerService.info(`Peer connected (inbound): ${serviceName} (${serviceHostname})`);

            ws.on('pong', () => {
                ws.lastPong = Date.now();
            });

            ws.on('message', (raw) => {
                this.handleMessage({ 
                    serviceName: serviceName,
                    hostname: serviceHostname,
                    ws: ws,
                    raw: raw,
                });
            });

            ws.on('close', () => {
                loggerService.info(`Peer disconnected: ${serviceName}`);

                if (this.wsConnections[serviceName]) {
                    delete this.wsConnections[serviceName][serviceHostname];
                }

                if (config.serviceName == 'controlService') {
                    commandBus.execute('controlService.removeServiceReplica', {
                        serviceName: serviceName,
                        replicaHostname: serviceHostname
                    });
                }
            });
        });
    },

    /**
     * Connect to control service
     *
     * @param {Object} config - Configuration object
     */
    async connectToControlService(config) {
        return new Promise((resolve, reject) => {
            try {
                const url = `ws://control-service:5000`;

                const ws = new WebSocket(url, {
                    headers: {
                        'x-api-key': 'my-secret-key',
                        'x-service-name': config.serviceName,
                        'x-service-hostname': config.hostname
                    }
                });

                // Resolve when the connection opens
                ws.on('open', () => {
                    loggerService.info(`Connected to control service`);

                    ws.lastPong = Date.now();

                    ws.on('pong', () => {
                        ws.lastPong = Date.now();
                    });

                    if (!this.wsConnections['controlService']) {
                        this.wsConnections['controlService'] = {};
                    }

                    this.wsConnections['controlService']['controlService'] = ws;

                    // Handle incoming messages
                    ws.on('message', (raw) => {
                        this.handleMessage({ serviceName: 'controlService', hostname: 'controlService', ws, raw });
                    });

                    resolve(ws);
                });

                // Reject if the connection closes immediately
                ws.on('close', () => {
                    loggerService.error(`Control service disconnected`);
                    delete this.wsConnections['controlService']?.['controlService'];
                    reject(new Error('Control service connection closed'));
                });

                // Reject on error
                ws.on('error', (err) => {
                    loggerService.error(`WS error with control service: ${err.message}`);
                    delete this.wsConnections['controlService']?.['controlService'];
                    reject(err);
                });

            } catch (err) {
                reject(err);
            }
        });
    },

    /**
     * Connect to peer
     */
    async connect({ peer, config }) {

        // Ensure we don't connect to ourselves or the control service again
        if (peer.name == config.serviceName || peer.name === 'controlService') {
            return;
        }

        if (!this.wsConnections[peer.name]) {
            this.wsConnections[peer.name] = {};
        }

        this.wsConnections[peer.name][peer.hostname] = null;

        // Connect
        try {
            const url = `ws://${peer.ip}:5000`;

            const ws = new WebSocket(url, {
                headers: {
                    'x-api-key': 'my-secret-key',
                    'x-service-name': config.serviceName,
                    'x-service-hostname': config.hostname
                }
            });

            ws.on('open', () => {
                loggerService.info(`Connected to peer ${peer.hostname} at ${url}`);

                ws.isAlive = true;
                ws.lastPong = Date.now();

                ws.on('pong', () => {
                    ws.lastPong = Date.now();
                });

                this.wsConnections[peer.name][peer.hostname] = ws;

                ws.on('message', (raw) => {
                    this.handleMessage({ 
                        serviceName: peer.name,
                        hostname: peer.hostname, 
                        ws: ws, 
                        raw: raw
                    });
                });
            });

            ws.on('close', () => {
                loggerService.info(`Peer ${peer.name} at ${peer.hostname} disconnected`);
                delete this.wsConnections[peer.name][peer.hostname];
                this.handlePeerFailure(peer, config);
            });

            ws.on('error', (err) => {
                loggerService.error(`WS error with ${peer.hostname}: ${err.message}`);
                delete this.wsConnections[peer.name][peer.hostname];
                this.handlePeerFailure(peer, config);
            });

        } catch (error) {
            loggerService.error(`Error during WS connection to ${peer.hostname}: ${error.message}`);
        }
    },

    /**
     * Handle peer failure by notifying control service and attempting to reconnect
     *
     * @param {Object} peer - The peer that failed
     * @param {Object} config - The local service configuration
     */
    async handlePeerFailure(peer, config) {
        try {
            // don't do anything if it's the control service
            // it's the other services responsibility to connect to the control service
            if (config.serviceName === 'controlService') {
                return
            }

            // only request a replacement peer if we aren't already connected to that service through another replica
            let getNewPeer = false;

            if (this.wsConnections[peer.name]?.length < 1) {
                getNewPeer = true;
            }

            // report failure to control service
            setTimeout(async () => {
                try {
                    loggerService.info('Reporting peer connection failure to control service', peer);

                    if (!peer.hostname) {
                        throw new Error('Peer information is missing for failed connection. This can occur if a service is down for a prolonged period. This service will now wait for an inbound connection.');
                    }

                    const newPeer = await commandBus.execute('controlService.peerConnectionDropped', {
                        requestingHostname: config.hostname,
                        requestingServicename: config.serviceName,
                        droppedPeerHostname: peer.hostname,
                        getNewPeer: getNewPeer
                    });

                    // connect to replacement peer if returned
                    if (newPeer?.hostname) {
                        this.connect({ 
                            peer: newPeer,
                            config: config
                        });
                    }
                } catch (err) {
                    loggerService.error(`Failed to report peer connection failure to control service for ${peer.hostname}: ${err.message}`);
                }
            }, 3000);
        } catch (err) {
            loggerService.error(`Failed to report peer connection failure to control service for ${peer.hostname}: ${err.message}`);
        }
    },

    /**
     * Handle inbound message
     *
     * @param {string} serviceName - Name of the peer service
     * @param {string} hostname - Hostname of the peer service
     * @param {WebSocket} ws - WebSocket connection to the peer
     * @param {string} raw - Raw message data
     */
    async handleMessage({ serviceName, hostname, ws, raw }) {
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
                this.sendResponse({ 
                    ws: ws,
                    messageId: msg.messageId,
                    response: result
                });
            } catch (err) {
                this.sendResponse({
                    ws: ws,
                    messageId: msg.messageId,
                    error: err.message
                });
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
                call.reject(new Error('RPC rejected: ' + msg.error));
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

        // randomly select any replica of the peer
        const nodes = this.wsConnections[serviceName];

        if (!nodes || !Object.keys(nodes) || Object.keys(nodes).length === 0) {
            throw new Error(`No replicas connected for service ${serviceName}`);
        }

        const nodeKey = Object.keys(nodes)[Math.floor(Math.random() * Object.keys(nodes).length)];
        let ws = nodes[nodeKey];

        // wait for connection if it's not ready yet
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            ws = await this.waitForWsReady({ ws, serviceName });
        }

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
    sendResponse({ ws, messageId, response = null, error = null }) {

        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return;
        }

        ws.send(JSON.stringify({ type: 'response', messageId, response, error }));
    },

    /**
     * Identify peer from connection request
     */
    identifyPeer(req) {
        return {
            serviceHostname: req.headers['x-service-hostname'] || `unknown-${Date.now()}`,
            serviceName: req.headers['x-service-name'] || `unknown-${Date.now()}`
        };
    },

    async waitForWsReady({ ws, serviceName, waitInterval = 50, maxWait = 5000 }) {
        const start = Date.now();
        while (true) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                return ws;
            }

            if (Date.now() - start > maxWait) {
                throw new Error(`WebSocket not connected to ${serviceName} after ${maxWait}ms`);
            }

            await new Promise(r => setTimeout(r, waitInterval));
        }
    }
};

