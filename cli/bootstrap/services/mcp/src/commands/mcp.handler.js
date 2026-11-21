import { commands, logger, error } from '@gnar-engine/core';
import { mcp } from '../services/mcp.service.js';
import { config } from '../config.js';
import { validateMcp } from '../schema/mcp.schema.js';


/**
 * Get single mcp
 */
commands.register('mcpService.getSingleMcp', async ({id}) => {
    if (id) {
        return await mcp.getById({id: id});
    } else {
        throw new error.badRequest('Mcp email or id required');
    }
});

/**
 * Get many mcps
 */
commands.register('mcpService.getManyMcps', async ({}) => {
    return await mcp.getAll();
});

/**
 * Create mcps
 */
commands.register('mcpService.createMcps', async ({ mcps }) => {
    const validationErrors = [];
    let createdNewMcps = [];

    for (const newData of mcps) {
        const { errors } = validateMcp(newData);
        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        const created = await mcp.create(newData);
        createdNewMcps.push(created);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid mcp data: ${validationErrors}`);
    }

    return createdNewMcps;
});

/**
 * Update mcp
 */
commands.register('mcpService.updateMcp', async ({id, newMcpData}) => {
    
    const validationErrors = [];
    
    if (!id) {
        throw new error.badRequest('Mcp ID required');
    
    }
    
    const obj = await mcp.getById({id: id});
    
    if (!obj) {
        throw new error.notFound('Mcp not found');
    
    }
    
    delete newMcpData.id;
    
    const { errors } = validateMcpUpdate(newMcpData);
    
    if (errors?.length) {
        validationErrors.push(errors);
    }
    
    if (validationErrors.length) {
        throw new error.badRequest(`Invalid mcp data: ${validationErrors}`);
    }
    
    return await mcp.update({
        id: id,
        updatedData: newMcpData
    });
});

/**
 * Delete mcp
 */
commands.register('mcpService.deleteMcp', async ({id}) => {
    const obj = await mcp.getById({id: id});
    if (!obj) {
        throw new error.notFound('Mcp not found');
    }
    return await mcp.delete({id: id});
});
