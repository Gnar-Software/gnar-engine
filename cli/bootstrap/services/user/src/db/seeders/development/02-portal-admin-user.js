import { logger } from '@gnar-engine/core';
import { user } from '../../../services/user.service.js';

/**
 * Up seeder
 */
export const up = async () => {

    // create root users using user service
    const users = [];

    users.push(await user.create({
        email: 'alex@gnar.co.uk',
        username: 'alexgnar',
        password: 'gnarlybulkwash',
        role: 'admin'
    })); 

    logger.info('Completed seeding root user data ' + JSON.stringify(users));
}

/**
 * Down seeder
 */
export const down = async () => {
    logger.info('Down seeder not implemented');
}
