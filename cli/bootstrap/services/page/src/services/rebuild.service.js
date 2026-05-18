import { db, logger } from '@gnar-engine/core';
import { ObjectId } from 'mongodb';
import { config } from '../config.js';

export const rebuild = {

    /**
     * path based rebuild
     *
     * @param {string} pageKey - The key of the page to rebuild
     */
    path: async ({ pageKey }) => {
        if (!config.rebuilds.pathBased.endpointBase || !config.rebuilds.pathBased.endpointPath) {
            logger.error('Path-based rebuild is not properly configured, please ensure you provide endpointBase and endpointPath');
            return;
        }

        if (!pageKey) {
            logger.error('Page key is required for path-based rebuild');
            return;
        }

        try {
            const endpoint = `${config.rebuilds.pathBased.endpointBase}${config.rebuilds.pathBased.endpointPath}`;
            const revalidateSecret = config.rebuilds.pathBased.revalidateSecret;
            logger.info('Path based rebuild', pageKey + ' : ' + endpoint);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: pageKey,
                    key: revalidateSecret
                })
            });

            if (!response.ok) {
                throw new Error(JSON.stringify(await response.json()));
            } else {
                logger.info(`Successfully triggered path-based rebuild for key ${pageKey}`);
            }
        } catch (error) {
            logger.error('Error triggering path-based rebuild:', error?.message);
        }
    }
}
