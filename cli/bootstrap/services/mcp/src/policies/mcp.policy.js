import { commands } from '@gnar-engine/core';
import { config } from '../config.js';

export const authorise = {

    /**
     * Authorise use of the MCP server
     *
     * Only MCP auth tokens are accepted, a portal session (request.user) never is.
     * Each tool call is then checked by the command's MCP policy in the owning service.
     */
    canUseMcp: async (request, reply) => {

        // validate origin to prevent DNS rebinding attacks (required by the MCP spec)
        if (request.headers.origin && !config.http.allowedOrigins.includes(request.headers.origin)) {
            return reply.code(403).send({ error: 'origin not allowed' });
        }

        // resolve the MCP auth token
        const authHeader = request.headers.authorization || '';
        const token = authHeader.split(' ')[1];

        const mcpAuth = token ? await commands.execute('mcpService.getMcpAuthenticatedUser', { token }) : false;

        // tell the client where to sign in
        if (!mcpAuth) {
            return reply.code(401)
                .header('WWW-Authenticate', `Bearer resource_metadata="${config.mcp.oauth.publicUrl}/.well-known/oauth-protected-resource/mcp", scope="mcp"`)
                .send({ error: 'not authenticated' });
        }

        request.mcpAuth = mcpAuth;
    }
}
