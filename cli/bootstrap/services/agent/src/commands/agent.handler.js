import { commands, logger } from '@gnar-engine/core';
import { Agent } from '../services/agent.service.js';
import { config } from '../config.js';


/**
 * Prompt the LLM agent
 */
commands.register('agentService.prompt', async ({input, chatId, authUser}) => {
    try {
        logger.info('recieved input' + JSON.stringify(input));
        let chatContextToStore = {};

        const [manifests, resolvedChatId, chat] = await Promise.all([
            // Get the manifests
            commands.execute('controlService.getManifests'),

            // Create a new chat if chatId is not provided
            (async () => {
                if (!chatId) {
                    return await Agent.createChat({
                        userId: '',
                        title: input.substring(0, 50),
                        sessionKey: input.sessionKey
                    });
                }

                return chatId
            })(),

            // Retrieve existing chat if chatId is provided
            (async () => {
                if (chatId) {
                    return await Agent.getChat({chatId});
                }

                return null;
            })()
        ]);

        let preparedInput;

        // Gather facts
        if (!chatId) {
            preparedInput = await Agent.prepareGatherFactsPrompt({inputText: input, manifests: manifests});
        }

        // Prepare Plan
        else if (chat) {
            await logger.info('GOT HERE WITH CHAT: ' + JSON.stringify(chat));
            preparedInput = await Agent.preparePlanPrompt({inputText: input, manifests: manifests, chat: chat});
        }

        // Infer
        let agentResponse = await Agent.infer({preparedInput});
        logger.info('Agent response: ' + agentResponse);
        agentResponse = JSON.parse(agentResponse);

        // Collect context from response
        chatContextToStore.actionPlan = agentResponse.actionPlan || null;
        chatContextToStore.input = input;
        chatContextToStore.responseText = agentResponse.responseText || null;

        // Collect required command implementations from manifests to store for next time
        if (agentResponse.commandsRequired) {
            chatContextToStore.commandsManifest = [];

            agentResponse.commandsRequired.forEach((commandRequired) => {
                manifests.manifests.forEach((manifest) => {
                    //logger.info('got here ' + commandRequired + ' ' + JSON.stringify(manifest.manifest) );
                    if (manifest.manifest?.commandImplementations?.[commandRequired]) {
                        chatContextToStore.commandsManifest.push(manifest.manifest.commandImplementations[commandRequired]);
                    }
                })
            });
        }

        logger.info('Chat context to store: ' + JSON.stringify(chatContextToStore));

        // Store chat messages
        chatId = resolvedChatId;
        Agent.createChatMessage({
            chatId: chatId,
            userName: authUser.username,
            context: chatContextToStore
        });

        // Plan execution loop
        if (agentResponse.actionPlan) {
            logger.info('Executing plan: ' + agentResponse.actionPlan);
    
        }

        let response = {
            structuredResponse: agentResponse,
            chatId: chatId
        };

        return response;
    } catch (err) {
        logger.error("Error handling LLM agent prompt: " + err);
        throw err;
    }
});
