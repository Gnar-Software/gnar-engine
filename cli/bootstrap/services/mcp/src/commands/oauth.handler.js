import { commands, logger, error } from '@gnar-engine/core';
import { config } from '../config.js';
import { oauthUtil } from '../utils/oauth.util.js';
import { mcpAuthToken } from '../services/mcpAuthToken.service.js';
import { oauthClient } from '../services/oauthClient.app.service.js';
import { oauthTransaction } from '../services/oauthTransaction.service.js';
import {
    validateAuthorizeQuery,
    validateCompleteTransaction,
    validateTokenRequest
} from '../schema/oauth.schema.js';


/**
 * Get protected resource metadata (RFC 9728)
 *
 * Tells MCP clients which authorization server issues tokens for the MCP endpoint.
 *
 * @param {Object} params
 * @returns {Promise<Object>} Protected resource metadata document
 */
commands.register('mcpService.getProtectedResourceMetadata', async ({}) => {
    const { publicUrl, scopes } = config.mcp.oauth;

    return {
        resource: `${publicUrl}/mcp`,
        authorization_servers: [`${publicUrl}/mcp`],
        scopes_supported: scopes,
        bearer_methods_supported: ['header']
    };
});


/**
 * Get authorization server metadata (RFC 8414)
 *
 * client_id_metadata_document_supported and the "none" token endpoint auth method are both
 * required for Claude Code and Codex to identify themselves with a CIMD client id.
 * The endpoints end in a slash because core only appends it to urls without a ".", and
 * authorize requests always contain one in the client_id.
 *
 * @param {Object} params
 * @returns {Promise<Object>} Authorization server metadata document
 */
commands.register('mcpService.getAuthorizationServerMetadata', async ({}) => {
    const { publicUrl, scopes } = config.mcp.oauth;

    return {
        issuer: `${publicUrl}/mcp`,
        authorization_endpoint: `${publicUrl}/mcp/oauth/authorize/`,
        token_endpoint: `${publicUrl}/mcp/oauth/token/`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
        client_id_metadata_document_supported: true,
        authorization_response_iss_parameter_supported: true,
        scopes_supported: scopes
    };
});


/**
 * Create OAuth transaction
 *
 * Validates an authorize request and stores it until the user approves or denies it in the portal.
 * An invalid client_id or redirect_uri is never redirected to. Once both are valid, other errors
 * are reported by redirecting to the client.
 *
 * @param {Object} params
 * @param {Object} params.query - Authorize request query (response_type, client_id, redirect_uri, state, scope, code_challenge, code_challenge_method, resource)
 * @returns {Promise<Object>} { redirectTo } the portal consent page, or the client's redirect uri with an error
 */
commands.register('mcpService.createOauthTransaction', async ({ query }) => {
    const { publicUrl, portalUrl, scopes, transactionTtl } = config.mcp.oauth;

    // validate the client and redirect uri
    const { errors } = validateAuthorizeQuery(query);
    if (errors) {
        throw new error.badRequest(`Invalid authorisation request: ${errors}`);
    }

    const client = await oauthClient.getClientMetadata({ clientId: query.client_id });

    if (!oauthClient.isRedirectUriAllowed({ redirectUri: query.redirect_uri, redirectUris: client.redirectUris })) {
        throw new error.badRequest('redirect_uri is not registered for this client');
    }

    // validate the rest of the request, reporting errors to the client
    let oauthError;

    if (query.response_type !== 'code') {
        oauthError = 'unsupported_response_type';
    } else if (!query.code_challenge || query.code_challenge_method !== 'S256') {
        oauthError = 'invalid_request';
    } else if (query.scope && !query.scope.split(' ').every(scope => scopes.includes(scope))) {
        oauthError = 'invalid_scope';
    } else if (query.resource && query.resource !== `${publicUrl}/mcp`) {
        oauthError = 'invalid_request';
    }

    if (oauthError) {
        return {
            redirectTo: oauthUtil.buildRedirect({
                redirectUri: query.redirect_uri,
                params: { error: oauthError, state: query.state, iss: `${publicUrl}/mcp` }
            })
        };
    }

    // store the transaction and send the user to the portal to approve it
    const id = await oauthTransaction.create({
        clientId: client.clientId,
        clientName: client.clientName,
        redirectUri: query.redirect_uri,
        state: query.state,
        codeChallenge: query.code_challenge,
        scope: 'mcp',
        ttl: transactionTtl
    });

    return { redirectTo: `${portalUrl}/oauth/consent?transactionId=${id}` };
});


/**
 * Get single OAuth transaction
 *
 * Returns what the portal consent page shows about a sign-in request.
 *
 * @param {Object} params
 * @param {string} params.id - Transaction id
 * @returns {Promise<Object>} { id, clientName, clientIdHost, redirectHost, isLoopbackRedirect, scope, expiresAt, isCompleted }
 */
commands.register('mcpService.getSingleOauthTransaction', async ({ id }) => {
    const transaction = await oauthTransaction.getById({ id });

    if (!transaction) {
        throw new error.notFound('Authorisation request not found');
    }

    return {
        id: transaction.id,
        clientName: transaction.clientName,
        clientIdHost: new URL(transaction.clientId).host,
        redirectHost: new URL(transaction.redirectUri).host,
        isLoopbackRedirect: oauthClient.isLoopbackRedirect({ redirectUri: transaction.redirectUri }),
        scope: transaction.scope,
        expiresAt: transaction.expiresAt,
        isCompleted: transaction.completedAt !== null || transaction.expiresAt <= new Date()
    };
});


/**
 * Complete OAuth transaction
 *
 * Records the signed in user's decision. Allow binds the user to the transaction and issues a
 * one-use authorisation code. A transaction can only be completed once, before it expires.
 *
 * @param {Object} params
 * @param {string} params.id - Transaction id
 * @param {string} params.userId - Signed in portal user
 * @param {string} params.decision - allow | deny
 * @returns {Promise<Object>} { redirectTo } the client's redirect uri with the code, or with access_denied
 */
commands.register('mcpService.completeOauthTransaction', async ({ id, userId, decision }) => {
    const { publicUrl, codeTtl } = config.mcp.oauth;

    const { errors } = validateCompleteTransaction({ decision });
    if (errors) {
        throw new error.badRequest(`Invalid decision: ${errors}`);
    }

    const transaction = await oauthTransaction.getById({ id });

    if (!transaction) {
        throw new error.notFound('Authorisation request not found');
    }

    // deny
    if (decision === 'deny') {
        if (!await oauthTransaction.deny({ id })) {
            throw new error.badRequest('Authorisation request has expired or was already used');
        }

        return {
            redirectTo: oauthUtil.buildRedirect({
                redirectUri: transaction.redirectUri,
                params: { error: 'access_denied', state: transaction.state, iss: `${publicUrl}/mcp` }
            })
        };
    }

    // allow
    const code = oauthUtil.randomToken({});

    const completed = await oauthTransaction.complete({
        id,
        userId,
        codeHash: oauthUtil.sha256Hex({ value: code }),
        codeTtl
    });

    if (!completed) {
        throw new error.badRequest('Authorisation request has expired or was already used');
    }

    logger.info(`OAuth transaction ${id} approved by user ${userId} for client ${transaction.clientId}`);

    return {
        redirectTo: oauthUtil.buildRedirect({
            redirectUri: transaction.redirectUri,
            params: { code, state: transaction.state, iss: `${publicUrl}/mcp` }
        })
    };
});


/**
 * Create MCP auth token
 *
 * Exchanges a one-use authorisation code for an MCP auth token. Error messages are OAuth error codes.
 * A code presented a second time is treated as replayed: the token issued from it is deleted.
 *
 * @param {Object} params
 * @param {string} params.grantType - Must be authorization_code
 * @param {string} params.code - Authorisation code
 * @param {string} params.codeVerifier - PKCE code verifier
 * @param {string} params.clientId - CIMD client id URL
 * @param {string} params.redirectUri - Redirect uri used at authorize
 * @param {string} [params.resource] - MCP resource url
 * @returns {Promise<Object>} { access_token, token_type, expires_in, scope }
 */
commands.register('mcpService.createMcpAuthToken', async ({ grantType, code, codeVerifier, clientId, redirectUri, resource }) => {
    const { publicUrl, tokenTtl } = config.mcp.oauth;

    if (grantType !== 'authorization_code') {
        throw new error.badRequest('unsupported_grant_type');
    }

    const { errors } = validateTokenRequest({ code, codeVerifier, clientId, redirectUri, resource });
    if (errors) {
        throw new error.badRequest('invalid_request');
    }

    if (resource && resource !== `${publicUrl}/mcp`) {
        throw new error.badRequest('invalid_request');
    }

    // check the code
    const transaction = await oauthTransaction.getByCodeHash({ codeHash: oauthUtil.sha256Hex({ value: code }) });

    if (!transaction || transaction.codeExpiresAt <= new Date()) {
        throw new error.badRequest('invalid_grant');
    }

    if (transaction.clientId !== clientId || transaction.redirectUri !== redirectUri) {
        throw new error.badRequest('invalid_grant');
    }

    if (!oauthUtil.verifyPkce({ codeVerifier, codeChallenge: transaction.codeChallenge })) {
        throw new error.badRequest('invalid_grant');
    }

    // a code can only be used once, a second use revokes the token issued from it
    if (!await oauthTransaction.markCodeUsed({ id: transaction.id })) {
        await mcpAuthToken.deleteByOauthTransactionId({ oauthTransactionId: transaction.id });
        logger.error(`Authorisation code for OAuth transaction ${transaction.id} was replayed, its MCP auth token has been revoked`);
        throw new error.badRequest('invalid_grant');
    }

    // issue the token
    const token = oauthUtil.randomToken({});

    const tokenId = await mcpAuthToken.create({
        tokenHash: oauthUtil.sha256Hex({ value: token }),
        userId: transaction.userId,
        clientId: transaction.clientId,
        clientName: transaction.clientName,
        oauthTransactionId: transaction.id,
        scope: transaction.scope,
        ttl: tokenTtl
    });

    logger.info(`MCP auth token ${tokenId} issued to user ${transaction.userId} for client ${transaction.clientId}`);

    return {
        access_token: token,
        token_type: 'Bearer',
        expires_in: tokenTtl,
        scope: transaction.scope
    };
});


/**
 * Get MCP authenticated user
 *
 * Resolves an MCP auth token. Portal session tokens are never accepted here.
 *
 * @param {Object} params
 * @param {string} params.token - MCP auth token
 * @returns {Promise<Object|false>} { user: { id, role }, clientId, tokenId }, or false
 */
commands.register('mcpService.getMcpAuthenticatedUser', async ({ token }) => {
    const authToken = await mcpAuthToken.getByTokenHash({ tokenHash: oauthUtil.sha256Hex({ value: token }) });

    if (!authToken || authToken.expiresAt <= new Date()) {
        return false;
    }

    const user = await commands.execute('userService.getSingleUser', { id: authToken.userId });

    if (!user) {
        return false;
    }

    await mcpAuthToken.updateLastUsed({ id: authToken.id });

    return {
        user: { id: user.id, role: user.role },
        clientId: authToken.clientId,
        tokenId: authToken.id
    };
});
