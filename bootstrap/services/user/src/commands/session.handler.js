import { commands } from 'gnarengine-service-core';
import { unauthenticatedSession } from '../services/session.service.js';


/**
 * Create unauthenticated session token
 * 
 * @returns {string} Session token
 */
commands.register('userService.createUnauthenticatedSessionToken', async () => {
    return unauthenticatedSession.createSessionToken();
});

/**
 * Verify unauthenticated session token
 * 
 * @param {Object} params
 * @param {string} params.sessionToken
 * @returns {boolean} Session token valid
 */
commands.register('userService.verifyUnauthenticatedSessionToken', async ({sessionToken}) => {
    return unauthenticatedSession.verifySessionToken({sessionToken});
});