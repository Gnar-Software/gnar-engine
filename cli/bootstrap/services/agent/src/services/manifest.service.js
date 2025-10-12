import { commands, logger } from '@gnar-engine/core';


export const manifestService = {

    commandList: {},
    schemaList: {},

    /**
     * Generate service manifests
     */
    generateServiceManifests: async () => {
        logger.info('Generating command manifest...');

        // Get services from control service
        const manifests = await commands.execute('controlService.getManifests'); 

        
    }

}
