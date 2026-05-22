import { commands, logger, webSockets } from '@gnar-engine/core';
import { registry } from '../services/registry.service.js';
import { peerConnection } from '../services/peerConnection.service.js';
import { validateService } from '../schema/control.schema.js';

/**
 * Register & get peers
 *
 * @param {Object} params
 * @param {Object} params.config The connecting service config
 * @returns {Promise<Object>} List of peers
 */
commands.register('controlService.registerAndGetPeers', async ({ config }) => {
    let peers = {};

    // register the service & replica
    try {
        await commands.execute('controlService.registerServiceAndReplica', {
            serviceName: config.serviceName,
            replicaSlot: config.replicaSlot,
            replicaHostname: config.replicaHostname,
            replicaIp: config.replicaIp
        });
    } catch (error) {
        logger.error(`Error registering service: ${error.message}`);
        throw error;
    }

    // Get peer addresses
    try {
        peers = await commands.execute('controlService.newPeerSet', {
            requestingHostname: config.replicaHostname
        });

        // remove the requesting service from the the peers object
        delete peers[config.serviceName];
    } catch (error) {
        logger.error(`Error getting peer set: ${error.message}`);
        throw error;
    }

    return peers;
});

/**
 * Register a service in the registry
 * 
 * @param {Object} params
 * @param {Object} params.serviceName
 * @param {Object} params.replicaSlot
 * @param {Object} params.replicaHostname
 * @param {Object} params.replicaIp
 * @returns {Promise<Object>} The service data
 */
commands.register('controlService.registerServiceAndReplica', async ({ serviceName, replicaSlot = '', replicaHostname, replicaIp }) => {

    // register the service
    let service;
    let serviceReplica;

    if (!serviceName || !replicaHostname || !replicaIp) {
        throw new Error('Service name, replica ip, and replica hostname are required to register service and replica');
    }

    try {
        service = await registry.getServiceByName({ 
            name: serviceName
        });

        delete service?.manifest;

        if (!service) {
            service = await registry.registerService({
                name: serviceName
            });

            logger.info(`Service registered: ${service.serviceName}`);
        }
    } catch (error) {
        throw error;
    }

    // register the service replica
    try {
        serviceReplica = await registry.getServiceReplicaByHostname({ replicaHostname });

        if (!serviceReplica) {
            serviceReplica = await registry.addServiceReplica({
                serviceName,
                replicaSlot,
                replicaHostname,
                replicaIp
            })
        }

    } catch (error) {
        logger.error(`Error registering service replica: ${error.message}`);
        throw error;
    }

    logger.info(`Service & replica registered`, service, serviceReplica);

    return { service, serviceReplica };
})

/**
 * Get all registered services
 *
 * @param {Object} params
 * @param {boolean} params.includeManifests Whether to include service manifests
 * @returns {Promise<Array>} List of services
 */
commands.register('controlService.getServices', async ({includeManifests}) => {
    let services;

    try {
        if (includeManifests) {
            services = await registry.getServicesWithManifests();
        } else {
            services = await registry.getServices();
        }
    } catch (error) {
        throw error;
    }

    return services;
})

/**
 * Create and return a new load balanced set of peer replica addresses for all registered services
 *
 * @param {Object} params
 * @param {string} params.requestingHostname Hostname of the requesting replica
 * @returns {Promise<Object>} Peer replica hostnames by service
 */
commands.register('controlService.newPeerSet', async({ requestingHostname }) => {
    let peers = {};

    try {
        const services = await registry.getServices();

        await Promise.all(
            services.map(async service => {
                peers[service.name] = await commands.execute('controlService.newPeerForService', {
                    requestingHostname,
                    serviceName: service.name
                });
            })
        );
    } catch (error) {
        throw error;
    }

    return peers;
});

/**
 * New peer for service
 *
 * @param {Object} params
 * @param {string} params.requestingHostname Hostname of the requesting replica
 * @param {string} params.serviceName Name of the service to get a new peer for
 * @returns {Promise<Object>} New peer object { name, hostname }
 */
commands.register('controlService.newPeerForService', async({ requestingHostname, serviceName }) => {

    // get all replicas for the service
    const serviceReplicas = await registry.getServiceReplicas({ serviceName });

    if (!serviceReplicas || serviceReplicas?.length === 0) {
        return '';
    }

    let lowestConnectedReplica = null;
    let lowestConnectionNum = Infinity;

    for (const replica of serviceReplicas) {
        if (replica.replicaHostname === requestingHostname) {
            continue;
        }

        const existingConnections = await peerConnection.get({
            replicaHostname: replica.replicaHostname
        });

        if (existingConnections?.length < lowestConnectionNum) {
            lowestConnectedReplica = replica;
            lowestConnectionNum = existingConnections.length;
        }
    }

    if (!lowestConnectedReplica) {
        return '';
    }

    // add the new connection
    try {
        await peerConnection.add({
            replicaHostname1: requestingHostname,
            replicaHostname2: lowestConnectedReplica.replicaHostname
        });
    } catch (error) {
        // assume duplicate entry error means the connection already exists, return empty string
        return '';
    }

    const newPeer = {
        name: serviceName,
        hostname: lowestConnectedReplica.replicaHostname,
        ip: lowestConnectedReplica.replicaIp
    };

    return newPeer;
});

/**
 * Peer connection dropped, get a new one
 *
 * @param {Object} params
 * @param {string} params.requestingHostname Hostname of the requesting replica
 * @param {string} params.droppedPeerHostname Hostname of the dropped peer replica
 * @returns {Promise<Object>} New peer replica hostnames by service
 */
commands.register('controlService.peerConnectionDropped', async({ requestingHostname, droppedPeerHostname, getNewPeer }) => {

    let newPeer = {};
    let droppedPeerServiceName = '';

    // get the service name of the dropped peer
    try {
        const droppedPeerReplica = await registry.getServiceReplicaByHostname({ 
            replicaHostname: droppedPeerHostname
        });

        droppedPeerServiceName = droppedPeerReplica?.serviceName;
    } catch (error) {
        logger.error(`Error getting dropped peer service: ${error.message}`);
        throw error;
    }

    // // remove the old replica and connections
    // try {
    //     await registry.removeServiceReplica({ replicaHostname: droppedPeerHostname });
    // } catch (error) {
    //     logger.error(`Error removing dropped peer replica: ${error.message}`);
    //     throw error;
    // }

    // get a new peer for the same service
    if (getNewPeer) {
        try {
            newPeer.serviceName = droppedPeerServiceName;
            newPeer.hostname = await commands.execute('controlService.newPeerForService', {
                requestingHostname: requestingHostname,
                serviceName: droppedPeerServiceName
            });
        } catch (error) {
            logger.error(`Error getting new peer for service ${droppedPeerServiceName}: ${error.message}`);
            throw error;
        }

        return newPeer;
    }

    return;
});

/**
 * Periodically tidy up all disconnected replicas from registry 
 */
commands.register('controlService.removeDisconnectedReplicas', async() => {
    let services;

    try {
        services = await registry.getServices();
    } catch (error) {
        logger.error(`Error getting services for health check: ${error.message}`);
        throw error;
    }

    await Promise.all(
        services.map(async service => {
            const serviceReplicas = await registry.getServiceReplicas({ serviceName: service.name });

            await Promise.all(
                serviceReplicas.map(async replica => {
                    if (!webSockets.wsConnections || webSockets.wsConnections.length === 0) {
                        logger.info('No websocket connections found, skipping disconnected replica check');
                    }

                    if (replica.serviceName !== 'controlService' && !webSockets.wsConnections[replica.serviceName]?.[replica.replicaHostname]) {
                        logger.info('Removing currently disconnected replica from registry', replica.hostname);
                
                        try {
                            await registry.removeServiceReplica({ replicaHostname: replica.replicaHostname });
                            await peerConnection.removeAllForReplica({ replicaHostname: replica.replicaHostname });
                        } catch (error) {
                            logger.error(`Error removing disconnected replica: ${error.message}`);
                        }
                    }
                })
            );
        })
    );
});

/**
 * Remove dead replicas and it's connections
 *
 * @param {Object} params
 * @param {string} params.serviceName Name of the service the dead replica belongs to
 * @param {string} params.replicaHostname Hostname of the dead replica
 */
commands.register('controlService.removeServiceReplica', async({ serviceName, replicaHostname }) => {
    try {
        if (!replicaHostname) {
            throw new Error('Replica hostname is required to remove service replica');
        }

        await registry.removeServiceReplica({ replicaHostname });
        await peerConnection.removeAllForReplica({ replicaHostname });

        logger.info(`Removed dead service replica and connections: ${serviceName} ${replicaHostname}`);
    } catch (error) {
        logger.error(`Error removing dead service replica: ${error.message}`);
        throw error;
    }
});

/**
 * Register manifests
 */
commands.register('controlService.registerManifest', async ({ serviceName, manifest }) => {
    const service = {
        name: serviceName,
        manifest
    };

    try {
        const errors = validateService(service);

        if (errors) {
            throw new Error(JSON.stringify(errors));
        }

        const existingService = await registry.getServiceByName({ name: serviceName });

        if (!existingService) {
            await registry.registerService(service);
        } else {
            await registry.updateService(service);
        }

        logger.info(`Registered manifest for service: ${serviceName}`);
    } catch (error) {
        logger.error(`Error registering manifest for service ${serviceName}: ${error.message}`);
        throw error;
    }
});

/**
 * Get all manifests
 *
 * @returns {Promise<Array>} List of manifests by service
 */
commands.register('controlService.getManifests', async() => {
    let manifests;
    try {
        manifests = await registry.getManifests();
    } catch (error) {
        throw error;
    }

    return manifests;
})
