import { logger } from 'gnarengine-service-core';
import { user } from '../../../services/user.service.js';


/**
 * Up seeder
 */
export const up = async () => {

    // create root users using user service
    const users = [];

    users.push(await user.create({
        email: process.env.USER_ROOT_ADMIN_EMAIL,
        username: process.env.USER_ROOT_ADMIN_USERNAME,
        password: process.env.USER_ROOT_ADMIN_PASSWORD,
        apiKey: process.env.USER_ROOT_ADMIN_API_KEY,
        role: 'service_admin'
    })); 

    logger.info('Completed seeding root user data ' + JSON.stringify(users));
}

/**
 * Down seeder
 */
export const down = async () => {
    logger.info('Down seeder not implemented');
}