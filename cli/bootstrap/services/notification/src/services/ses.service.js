import { SESClient } from '@aws-sdk/client-ses';
import { logger } from './logger.service.js';

let sesClientInstance = null;

/**
 * Get SES Client Instance
 * 
 * @returns {SESClient} - SESClient instance
 * @description Returns a singleton instance of the SESClient
 */
export const getSesClient = () => {
	if (!sesClientInstance) {
		sesClientInstance = new SESClient({
			region: process.env.NOTIFICATION_AWS_REGION,
			credentials: {
				accessKeyId: process.env.NOTIFICATION_AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.NOTIFICATION_AWS_SECRET_ACCESS_KEY
			}
		});
	}
	return sesClientInstance;
};