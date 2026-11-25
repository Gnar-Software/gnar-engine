import { commands, logger, error } from '@gnar-engine/core';
import { authorise } from '../policies/mcp.policy.js';
import { config } from '../config.js';
import { validateJsonRpcMessage } from '../schema/mcp.schema.js';
import { jsonRpc } from '../utils/json-rpc.util.js';

/**
 * HTTP controller - MCP Streamable HTTP transport (stateless)
 */
export const httpController = {

	/**
	 * Receive a JSON-RPC message from the MCP client
	 */
	post: {
		method: 'POST',
		url: '/mcp/',
		preHandler: async (request, reply) => authorise.canUseMcp(request, reply),
		handler: async (request, reply) => {

			// validate the JSON-RPC message
			const { errors } = validateJsonRpcMessage(request.body);
			if (errors) {
				return reply.code(400).send(jsonRpc.error({
					id: null,
					code: config.mcp.errorCodes.invalidRequest,
					message: `Invalid request: ${errors}`
				}));
			}

			// notifications (no id) and client responses (no method) are acknowledged with no body
			if (request.body.id === undefined || request.body.method === undefined) {
				return reply.code(202).send();
			}

			// execute the MCP method
			let response;
			try {
				let result;

				switch (request.body.method) {
					case 'initialize':
						result = await commands.execute('mcpService.initialize', { params: request.body.params });
						break;
					case 'ping':
						result = {};
						break;
					case 'tools/list':
						result = await commands.execute('mcpService.listTools', {});
						break;
					case 'tools/call':
						result = await commands.execute('mcpService.callTool', { params: request.body.params });
						break;
					case 'resources/list':
						result = await commands.execute('mcpService.listResources', {});
						break;
					case 'resources/templates/list':
						result = { resourceTemplates: [] };
						break;
					case 'resources/read':
						result = await commands.execute('mcpService.readResource', { params: request.body.params });
						break;
					default:
						return reply.code(200).send(jsonRpc.error({
							id: request.body.id,
							code: config.mcp.errorCodes.methodNotFound,
							message: `Method not found: ${request.body.method}`
						}));
				}

				response = jsonRpc.result({ id: request.body.id, result });
			} catch (methodError) {
				logger.error(`MCP ${request.body.method} failed: ${methodError.message}`);

				// map errors to JSON-RPC error codes
				let code = config.mcp.errorCodes.internalError;
				if (methodError instanceof error.badRequest) {
					code = config.mcp.errorCodes.invalidParams;
				}
				if (methodError instanceof error.notFound) {
					code = config.mcp.errorCodes.resourceNotFound;
				}

				response = jsonRpc.error({ id: request.body.id, code, message: methodError.message });
			}

			// respond as a single event SSE stream when enabled and accepted by the client
			if (config.mcp.sseResponses && request.headers.accept && request.headers.accept.includes('text/event-stream')) {
				reply.hijack();
				reply.raw.writeHead(200, {
					...reply.getHeaders(),
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive'
				});
				reply.raw.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
				reply.raw.end();
				return;
			}

			// respond as JSON
			return reply.code(200).header('Content-Type', 'application/json').send(response);
		}
	},

	/**
	 * Server initiated SSE stream - not offered by this stateless server
	 */
	get: {
		method: 'GET',
		url: '/mcp/',
		handler: async (request, reply) => {
			return reply.code(405).header('Allow', 'POST').send();
		}
	},

	/**
	 * Session termination - no sessions in this stateless server
	 */
	delete: {
		method: 'DELETE',
		url: '/mcp/',
		handler: async (request, reply) => {
			return reply.code(405).header('Allow', 'POST').send();
		}
	}
}
