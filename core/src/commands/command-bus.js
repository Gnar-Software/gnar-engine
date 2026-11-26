import { messageAndForget } from "../services/message.service.js";
import { wsManager } from "../services/websocket.service.js";
import { UnauthorisedError } from "../errors/errors.js";
import { manifest } from "./command-manifest.js";

/**
 * Command bus
 */
export const commandBus = {
    config: {},
    handlers: new Map(),
    mcpPolicies: new Map(),

    init(config) {
        this.config = config;
    },

    register(commandName, handlerFunction, metadata = {}) {
        this.handlers.set(commandName, handlerFunction);

        // commands exposed over MCP must have a policy, which is kept out of the manifest
        if (metadata.mcp) {
            const { policy, ...mcp } = metadata.mcp;

            if (typeof policy !== 'function') {
                throw new Error(`Command ${commandName} has mcp metadata but no mcp.policy`);
            }

            this.mcpPolicies.set(commandName, policy);
            metadata = { ...metadata, mcp: { ...mcp, hasPolicy: true } };
        }

        manifest.addCommand({ commandName, handlerFunction, metadata });
    },

    /**
     * Run the command's MCP policy against the MCP authenticated user
     *
     * @param {Object} params
     * @param {string} params.commandName - Full command name, e.g. "userService.getSingleUser"
     * @param {Object} params.payload - Command input
     * @param {Object} params.mcpAuth - { user: { id, role }, clientId, tokenId }
     */
    async authoriseMcp({ commandName, payload, mcpAuth }) {
        const policy = this.mcpPolicies.get(commandName);

        if (!policy) {
            throw new UnauthorisedError(`Command ${commandName} is not available over MCP`);
        }

        await policy({ user: mcpAuth.user, payload });
    },

    /**
	 * Executes a command in monolith or microservice mode.
	 * @param {string} fullCommandName - e.g., "userService.doThing"
	 * @param {Object} payload - Command input
	 * @param {Object} [options]
	 * @param {boolean} [options.fireAndForget=false] - If true, don't await response
	 * @param {number} [options.timeout] - Websocket response timeout in ms
	 * @param {Object} [options.mcpAuth] - MCP authenticated caller, checked against the command's MCP policy
	 */
	async execute(fullCommandName, payload, options = {}) {
		const { fireAndForget = false, mcpAuth } = options;

		// Monolith - try the handler directly
        if (this.config.architecture == 'modular-monolith') {
			const handler = this.handlers.get(fullCommandName);
			if (!handler) {
				throw new Error(`Command "${fullCommandName}" not registered`);
			}
			if (mcpAuth) {
				await this.authoriseMcp({ commandName: fullCommandName, payload, mcpAuth });
			}
			return await handler(payload);
		}

        // microservice
        else {
            // local handler as no service name
            const [serviceName, methodName] = fullCommandName.split('.');
            if (!serviceName || !methodName) {
                const prefixedCommandName = this.config.serviceName + '.' + fullCommandName;

                const handler = this.handlers.get(prefixedCommandName);
                if (!handler) {
                    throw new Error(`Command "${prefixedCommandName}" not registered`);
                }
                if (mcpAuth) {
                    await this.authoriseMcp({ commandName: prefixedCommandName, payload, mcpAuth });
                }
                return await handler(payload);
            }

            // local handler as service name matches
            if (serviceName === this.config.serviceName) {
                const handler = this.handlers.get(fullCommandName);
                if (!handler) {
                    throw new Error(`Command "${fullCommandName}" not registered`);
                }
                if (mcpAuth) {
                    await this.authoriseMcp({ commandName: fullCommandName, payload, mcpAuth });
                }
                return await handler(payload);
            }

            // Fire and forget message queue
            if (fireAndForget) {
                // the message queue doesn't carry mcpAuth, so the policy could not be checked
                if (mcpAuth) {
                    throw new Error('mcpAuth cannot be sent with fireAndForget');
                }

                messageAndForget(serviceName, {
                    method: fullCommandName,
                    data: payload
                });
                return;
            }

            // Execute via websocket synchronously
            const wsResult = await wsManager.send(serviceName, fullCommandName, payload, options);
            return wsResult;
        }
    }
}
