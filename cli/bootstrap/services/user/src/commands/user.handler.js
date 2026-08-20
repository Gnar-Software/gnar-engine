import { config } from '../config.js';
import { user } from '../services/user.service.js';
import { auth } from '../services/authentication.service.js';
import { commands, logger, error, utils } from '@gnar-engine/core';
import { passwordReset } from '../services/passwordReset.service.js';
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
commands.register('userService.authenticate', async ({ username, password, apiKey }) => {

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
            token = await auth.createSessionToken(userId);
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
            token = await auth.createSessionToken(userId);
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
commands.register('userService.getAuthenticatedUser', async ({ token }) => {

    const session = await auth.getAuthenticatedUser(token);

    if (!session || !session.userId || !session.tokenExpiresAt) {
        return false;
    }

    if (session.userId) {
        const userObj = await user.getById({ id: session.userId });

        if (userObj) {
            userObj.tokenExpiresAt = session.tokenExpiresAt;
            return userObj;
        }
    }
});


/**
 * Get single user
 * 
 * @param {Object} params
 * @param {string|number} params.id - User ID
 * @returns {Promise<Object>} The user data
 */
commands.register('userService.getSingleUser', async ({ id, email }) => {

    if (id) {
        return await user.getById({ id: id });
    } else if (email) {
        return await user.getByEmail({ email: email });
    } else {
        throw new error.badRequest('User email or id required');
    }
});


/**
 * Get many users
 * 
 * @param {Object} params
 * @param {number} params.pageSize - Number of users per page
 * @param {number} params.pageNum - Page number
 * @param {Object} params.filters - Optional filters (e.g. role)
 * @returns {Promise<Object>} The user data
 */
commands.register('userService.getManyUsers', async ({ pageSize, pageNum, filters, ids, orderBy }) => {

    const result = await user.getAll({ pageNum, pageSize, filters, ids, orderBy });
    return result;
});


/**
 * Search users
 * 
 * @param {Object} params
 * @param {string} params.term - Search term
 * @param {number} params.pageSize - Number of users per page
 * @param {number} params.pageNum - Page number
 * @returns {Promise<Object>} The user data
 */
commands.register('userService.searchUsers', async ({ term, pageSize, pageNum }) => {

    if (!term) {
        throw new error.badRequest('Search term required');
    }

    const keys = ['email', 'username', ]
    const result =  await user.search({ term, keys, pageSize, pageNum });

    return result;
});


/**
 * Creat users with random password
 * 
 * @param {Object} params
 * @param {Array} params.users - New user data
 */
commands.register('userService.createUserWithRandomPassword', async ({ users, sendNotification = false }) => {

    const validationErrors = [];
    let createdNewUsers = [];

    // validate user data
    for (const newUserData of users) {

        // create random password
        const password = Math.random().toString(36);
        newUserData.password = password;

        const { errors } = validateUser(newUserData);

        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        if (!newUserData.role || newUserData.role !== 'service_admin') {
            // ensure emails are unique
            const existingUser = await user.getByEmail({ email: newUserData.email });

            if (existingUser) {
                validationErrors.push(`User with email ${newUserData.email} already exists`);
            }
        }
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid user data: ${validationErrors}`);
    }

    // add users
    for (const newUserData of users) {
        const newUser = await user.create(newUserData);
        createdNewUsers.push(newUser);

        // Optionally invite the user to claim their account (password reset flow with claim wording).
        if (sendNotification && newUser?.email) {
            try {
                await commands.execute('userService.requestPasswordReset', {
                    email: newUser.email,
                    claimAccount: true
                });
            } catch (err) {
                // A failed invitation should not roll back a successful user creation.
                logger.error(err.message, `Failed to send claim account email to ${newUser.email}`);
            }
        }
    }

    return createdNewUsers;
});


/**
 * Create users
 * 
 * @param {Object} params
 * @param {Object[]} params.users - Array of new user data
 * @returns {Promise<Array>} Array of new users
 */
commands.register('userService.createUsers', async ({ users, sendNotification = false }) => {

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
        const existingUser = await user.getByEmail({ email: newUserData.email });

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

        // Optionally invite the user to claim their account (password reset flow with claim wording).
        if (sendNotification && newUser?.email) {
            try {
                await commands.execute('userService.requestPasswordReset', {
                    email: newUser.email,
                    claimAccount: true
                });
            } catch (err) {
                // A failed invitation should not roll back a successful user creation.
                logger.error(err.message, `Failed to send claim account email to ${newUser.email}`);
            }
        }
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
commands.register('userService.updateUser', async ({ id, newUserData }) => {

    const validationErrors = [];

    // check request includes user id
    if (!id) {
        throw new error.badRequest('User ID required');
    }

    // check user exists
    const userObj = await user.getById({ id: id });

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
        const existingUser = await user.getByEmail({ email: newUserData.email });
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
commands.register('userService.deleteUser', async ({ id }) => {

    const userObj = await user.getById({ id: id });

    if (!userObj) {
        throw new error.notFound('User not found');
    }

    return await user.delete({ id: id });
});


/**
 * Request password reset
 *
 * Also used to send the "claim your account" invitation when claimAccount is true.
 * Both flows issue a reset token and link to the same front end page; only the
 * email wording (template and subject) differs.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {boolean} params.createComplexPassword - Require a complex password when setting the new one
 * @param {boolean} params.claimAccount - Send the claim account invitation wording instead of the reset wording
 * @returns {Promise<{success: boolean}>}
 */
commands.register('userService.requestPasswordReset', async ({ email, createComplexPassword = false, claimAccount = false }) => {
    if (!email) {
        return {
            success: false,
        };
    }

    try {
        const userObj = await user.getByEmail({ email });
        if (!userObj) {
            return { success: false };
        }

        const token = await passwordReset.createResetToken({ email: userObj.email });

        // Claim and reset share the same set-password page; the claim flag only changes the wording.
        const templateSlug = claimAccount ? 'claim_your_account' : 'account_password_reset';
        const subjectLine = claimAccount ? 'Claim your account' : 'Reset your password';

        const frontEndUrl = config.frontEndUrl || '';
        const resetUrl = frontEndUrl
            ? `${frontEndUrl}/portal/password-reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&create_complex_password=${createComplexPassword ? 'true' : 'false'}${claimAccount ? '&claim=true' : ''}`
            : null;

        if (process.env.USER_NODE_ENV !== 'production') {
            logger.info(`${claimAccount ? 'Account claim' : 'Password reset'} requested for ${email}${resetUrl ? ` | resetUrl: ${resetUrl}` : ''}`);
        }

        // trigger notification
        const notifications = await commands.execute('notificationService.createNotifications', {
            notifications: [
                {
                    type: 'email',
                    userId: userObj.id,
                    emailAddress: [userObj.email],
                    fromEmail: 'noreply@butlinpm.com',
                    subjectLine: subjectLine,
                    templateSlug: templateSlug,
                    content: '',
                    templateData: {
                        userName: userObj.username,
                        resetUrl: resetUrl,
                        logoUrl: '#'
                    }
                }
            ]
        });

        logger.info(notifications);

        const notificationId = notifications?.[0]?.id;
        if (!notificationId) {
            throw new Error('Failed to create notification');
        }

        return { success: true };
    } catch (err) {
        logger.error(err.message, 'Password reset request failed');
        return { success: false };
    }
});

/**
 * Change password
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.token
 * @param {string} params.password
 * @returns {Promise<{success: boolean}>}
 */
commands.register('userService.changePassword', async ({ email, token, password }) => {
    if (!email || !token || !password) {
        throw new error.badRequest('email, token and password are required');
    }

    if (typeof password !== 'string' || password.length < 8) {
        throw new error.badRequest('Password must be at least 8 characters');
    }

    // verify token
    const isValidToken = await passwordReset.verifyPasswordResetToken({
        token,
        email,
    });

    if (!isValidToken) {
        throw new error.badRequest('Invalid or expired password reset token');
    }

    // check user exists
    const userObj = await user.getByEmail({ email });

    if (!userObj) {
        throw new error.notFound('User not found');
    }

    // hash + update password
    const hashedPassword = await utils.hash( password );

    const updateResult = await user.changePassword({
        id: userObj.id,
        newPassword: hashedPassword,
    });

    if (!updateResult) {
        throw new error.badRequest('Password reset failed');
    }

    await passwordReset.consumeToken({ token, email });

    return { success: true };
});
