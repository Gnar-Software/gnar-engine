import { messageAndForget } from "../services/message.service.js";
import { wsManager } from "../services/websocket.service.js";
import { manifest } from "./command-manifest.js";

/**
 * Command bus
 */
export const commandBus = {
    config: {},
    handlers: new Map(),

    init(config) {
        this.config = config;
    },
  
    register(commandName, handlerFunction) {
        this.handlers.set(commandName, handlerFunction);
        manifest.addCommand({ commandName, handlerFunction });
    },
  
    /**
	 * Executes a command in monolith or microservice mode.
	 * @param {string} fullCommandName - e.g., "userService.doThing"
	 * @param {Object} payload - Command input
	 * @param {Object} [options]
	 * @param {boolean} [options.fireAndForget=false] - If true, don't await response
	 */
	async execute(fullCommandName, payload, options = {}) {
		const { fireAndForget = false } = options;

		// Monolith - try the handler directly
        if (this.config.architecture == 'modular-monolith') {
			const handler = this.handlers.get(fullCommandName);
			if (!handler) {
				throw new Error(`Command "${fullCommandName}" not registered`);
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
                return await handler(payload);
            }

            // local handler as service name matches
            if (serviceName === this.config.serviceName) {
                const handler = this.handlers.get(fullCommandName);
                if (!handler) {
                    throw new Error(`Command "${fullCommandName}" not registered`);
                }
                return await handler(payload);
            }

            // Fire and forget message queue
            if (fireAndForget) {
                messageAndForget(serviceName, {
                    method: fullCommandName,
                    data: payload
                });
                return;
            }

            // Execute via websocket synchronously
            return await wsManager.send(serviceName, fullCommandName, payload);
        }
    }
}
