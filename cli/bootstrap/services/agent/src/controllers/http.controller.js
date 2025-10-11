import { commands, logger } from 'gnarengine-service-core';
import { authorise } from '../policies/agent.policy.js';

/**
 * HTTP controller
 */
export const httpController = {

	/**
	 * Prompt the agent
	 */
	agentPrompt: {
		method: 'POST',
		url: '/agent/prompt',
		preHandler: async (request, reply) => authorise.agentPrompt(request, reply),
		handler: async (request, reply) => {
			logger.info('Received agent prompt request' + JSON.stringify(request.body));
			const params = {
				input: request.body.textInput,
                chatId: request.body.chatId || '',
                authUser: request.user
			};

			// Sanitize input (remove all JSON delimiters)
			params.input = params.input.replace(/[\{\}\[\]\"\'\:\,]/g, '');

			// execute
			let response;
            logger.info('params' + JSON.stringify(params));
			try {
				response = await commands.execute('prompt', params);
			} catch (error) {
				logger.error(error.message);
				return reply.code(500).send({ error: error.message});
			}

            logger.info('response is: ' + JSON.stringify(response));

			// handle response
			reply.code(200).send(response);
		}
	},

}
