import { commands, logger, error } from 'gnarengine-service-core';
import { auth } from '../services/authentication.service.js';
import { user } from '../services/user.service.js';
import { config } from '../config.js';
import { validateUser, validateServiceAdminUser, validateUserUpdate, validateServiceAdminUserUpdate } from '../schema/user.schema.js';


/**
 * Authentication
 * 
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.apiKey
 * @returns {Promise<Object>} The user data
 */
commands.register('userService.authenticate', async ({username, password, apiKey}) => {

    // authenticate
    let token = '';

    if (config.authenticationOptions.password_auth_enabled) {
        if (username && password) {
            // verify credentials
            const userId = await auth.verifyCredentials({
                username: username,
                password: password
            });

            if (!userId) {
                throw new error.unauthorised('Invalid credentials');
            }

            // create new session token
            token = auth.createSessionToken(userId);
        }
    }

    if (config.authenticationOptions.api_key_auth_enabled) {
        if (apiKey && username) {
            // verify credentials
            const userId = await auth.verifyApiKey({
                apiKey: apiKey,
                username: username
            });

            if (!userId) {
                throw new error.unauthorised('Invalid API key');
            }

            // create new session token
            token = auth.createSessionToken(userId);
        }
    }

    // send response
    if (token) {
        logger.info('returning token ' + token);
        return token;
    }

    logger.info('invalid credentials');

    throw new error.unauthorised('Invalid credentials');
});

/**
 * Get authenticated user
 * 
 * @param {Object} params
 * @param {string} params.token - Session token
 * @returns {Promise<Object>} The user data
 */
commands.register('userService.getAuthenticatedUser', async ({token}) => {

    const user_id = await auth.getAuthenticatedUser(token);

    if (user_id) {
        logger.info('Auth user: ' + user_id);
        const userObj = await user.getById({id: user_id});

        if (userObj) {
            delete userObj.password;
            delete userObj.apiKey;

            return userObj;
        }
    }

    return;
});


/**
 * Get single user
 * 
 * @param {Object} params
 * @param {string|number} params.id - User ID
 * @returns {Promise<Object>} The user data
 */
commands.register('userService.getSingleUser', async ({id, email}) => {

    if (id) {
        return await user.getById({id: id});
    } else if (email) {
        return await user.getByEmail({email: email});
    } else {
        throw new error.badRequest('User email or id required');
    }
});

/**
 * Get many users
 * 
 * @param {Object} params
 * @returns {Promise<Object>} The user data
 */
commands.register('userService.getManyUsers', async ({}) => {

    return await user.getAll();
});

/**
 * Creat users with random password
 * 
 * @param {Object} params
 * @param {Object} params.user - New user data
 */
commands.register('userService.createUserWithRandomPassword', async ({user}) => {

    // create random password
    const password = Math.random().toString(36);
    const userData = {
        ...user,
        password: password
    };

    logger.info('creating new user : ' + JSON.stringify(userData));

    // create user
    try {
        const newUsers = await createUsers({users: [userData]})

        if (!newUsers || newUsers.length === 0) {
            throw new error.badRequest('User creation failed');
        }
    
        return newUsers[0];
    } catch (error) {
        throw new error.badRequest('User creation failed: ' + error);
    }
});

/**
 * Create users
 * 
 * @param {Object} params
 * @param {Object[]} params.users - Array of new user data
 * @returns {Promise<Array>} Array of new users
 */
commands.register('userService.createUsers', async ({users}) => {

    const validationErrors = [];
    let createdNewUsers = [];

    // validate user data
    for (const newUserData of users) {
        if (!newUserData.role || newUserData.role !== 'service_admin') {
            const { errors } = validateUser(newUserData);

            if (errors?.length) {
                validationErrors.push(errors);
                continue;
            }
        } else {
            const { errors } = validateServiceAdminUser(newUserData);

            if (errors?.length) {
                validationErrors.push(errors);
                continue;
            }
        }

        // ensure emails are unique
        const existingUser = await user.getByEmail({email: newUserData.email});

        if (existingUser) {
            validationErrors.push(`User with email ${newUserData.email} already exists`);
        }
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid user data: ${validationErrors}`);
    }

    // add users
    for (const newUserData of users) {
        const newUser = await user.create(newUserData);
        createdNewUsers.push(newUser);
    }

    return createdNewUsers;
});

/**
 * Update user
 * 
 * @param {Object} params
 * @param {string|number} params.id - User ID
 * @param {Object[]} params.newUserData - New user data
 * @returns {Promise<Array>} Array of new users
 */
commands.register('userService.updateUser', async ({id, newUserData}) => {

    const validationErrors = [];

    // check request includes user id
    if (!id) {
        throw new error.badRequest('User ID required');
    }

    // check user exists
    const userObj = await user.getById({id: id});

    if (!userObj) {
        throw new error.notFound('User not found');
    }
    
    // remove id from new user data
    delete newUserData.id;

    // validate user data
    if (newUserData.role == 'service_admin') {
        const { errors } = validateServiceAdminUserUpdate(newUserData);

        if (errors?.length) {
            validationErrors.push(errors);
        }
    } else {
        const { errors } = validateUserUpdate(newUserData);

        if (errors?.length) {
            validationErrors.push(errors);
        }
    }

    // ensure emails are unique if being updated
    if (newUserData.email && newUserData.email !== userObj.email) {
        const existingUser = await user.getByEmail({email: newUserData.email});
        logger.info('Existing user with this email:' + existingUser);

        if (existingUser) {
            validationErrors.push(`User with email ${newUserData.email} already exists`);
        }
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid user data: ${validationErrors}`);
    }

    // update
    return await user.update({
        id: id,
        username: newUserData.username ?? userObj.username ?? '',
        email: newUserData.email ?? userObj.email ?? '',
        role: newUserData.role ?? userObj.role ?? config.defaultUserRole
    });
});

/**
 * Delete user
 * 
 * @param {Object} params
 * @param {string|number} params.id - User ID
 * @returns {Promise<Boolean>} Success
 */
commands.register('userService.deleteUser', async ({id}) => {

    const userObj = await user.getById({id: id});

    if (!userObj) {
        throw new error.notFound('User not found');
    }

    return await user.delete({id: id});
});