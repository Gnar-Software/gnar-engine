import { commands, logger } from '@gnar-engine/core';
import { registry } from '../services/registry.service.js';
import { validateService } from '../schema/control.schema.js';


/**
 * Register a service in the registry
 * 
 * @param {Object} params
 * @param {Object} params.serivce The service data
 * @returns {Promise<Object>} The service data
 */
commands.register('controlService.registerService', async ({service}) => {
    
    // validate the service
    const errors = validateService(service);

    if (errors) {
        throw new Error(JSON.stringify(errors));
    }

    // register the service
    let serviceId;
    try {
        const existingServices = await registry.getServices();

        if (existingServices.find(s => s.name === service.name)) {
            await registry.updateService(service);
        } else {
            serviceId = await registry.registerService(service);
        }

        logger.info(`Service registered: ${service.name}`);
    } catch (error) {
        throw error;
    }

    // return the service data
    return {
        id: serviceId,
        ...service
    };
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
