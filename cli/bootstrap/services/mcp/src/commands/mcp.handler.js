import { commands, logger, error } from '@gnar-engine/core';
import { mcp } from '../services/mcp.service.js';
import { config } from '../config.js';


/**
 * Fetch and prepare MCP tools & resources
 */
commands.register('mcpService.getMcpMethods', async ({}) => {
    try {
        const { services, manifests } = await commands.execute('controlService.getServices', {
            includeManifests: true
        });

    } catch (error) {
        logger.error('Error fetching services from control service: ' + error.message);
    }
});
