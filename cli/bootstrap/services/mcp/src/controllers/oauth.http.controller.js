import { commands, error } from '@gnar-engine/core';
import { authorise } from '../policies/oauth.policy.js';

/**
 * HTTP controller - OAuth authorization server for MCP clients
 */
export const httpController = {

	/**
	 * Protected resource metadata for the MCP endpoint
	 */
	getProtectedResourceMetadata: {
		method: 'GET',
		url: '/.well-known/oauth-protected-resource/mcp',
		handler: async (request, reply) => {
			const result = await commands.execute('mcpService.getProtectedResourceMetadata', {});
			reply.code(200).send(result);
		}
	},

	/**
	 * Authorization server metadata
	 */
	getAuthorizationServerMetadata: {
		method: 'GET',
		url: '/.well-known/oauth-authorization-server/mcp',
		handler: async (request, reply) => {
			const result = await commands.execute('mcpService.getAuthorizationServerMetadata', {});
			reply.code(200).send(result);
		}
	},

	/**
	 * Authorize, redirects to the portal consent page
	 */
	authorize: {
		method: 'GET',
		url: '/mcp/oauth/authorize/',
		handler: async (request, reply) => {
			const { redirectTo } = await commands.execute('mcpService.createOauthTransaction', { query: request.query });
			reply.redirect(redirectTo);
		}
	},

	/**
	 * Get single OAuth transaction, for the portal consent page
	 */
	getSingleTransaction: {
		method: 'GET',
		url: '/mcp/oauth/transactions/:id/',
		preHandler: async (request, reply) => authorise.getSingleTransaction(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id
			};
			const result = await commands.execute('mcpService.getSingleOauthTransaction', params);
			reply.code(200).send({ oauthTransaction: result });
		}
	},

	/**
	 * Complete OAuth transaction with the portal user's decision
	 *
	 * Responds with the redirect as JSON, the portal navigates to it
	 */
	completeTransaction: {
		method: 'POST',
		url: '/mcp/oauth/transactions/:id/complete/',
		preHandler: async (request, reply) => authorise.completeTransaction(request, reply),
		handler: async (request, reply) => {
			const params = {
				id: request.params.id,
				userId: request.user.id,
				decision: request.body?.decision
			};
			const result = await commands.execute('mcpService.completeOauthTransaction', params);
			reply.code(200).send(result);
		}
	},

	/**
	 * Token, exchanges an authorisation code for an MCP auth token
	 *
	 * Errors use the OAuth format { error } rather than core's error response
	 */
	token: {
		method: 'POST',
		url: '/mcp/oauth/token/',
		handler: async (request, reply) => {
			const params = {
				grantType: request.body?.grant_type,
				code: request.body?.code,
				codeVerifier: request.body?.code_verifier,
				clientId: request.body?.client_id,
				redirectUri: request.body?.redirect_uri,
				resource: request.body?.resource
			};

			try {
				const result = await commands.execute('mcpService.createMcpAuthToken', params);
				reply.code(200).header('Cache-Control', 'no-store').send(result);
			} catch (tokenError) {
				if (tokenError instanceof error.badRequest) {
					return reply.code(400).header('Cache-Control', 'no-store').send({ error: tokenError.message });
				}
				throw tokenError;
			}
		}
	}
}
