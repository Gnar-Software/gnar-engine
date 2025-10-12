import { db, logger, utils } from '@gnar-engine/core';
import { config } from '../config.js';
import { chatGptAgent } from '../services/chatgpt.service.js';

export const Agent = {

    client: {},

    /**
     * Initialise LLM agent
     *
     * @returns {string} response
     */
    init: async function () {
        switch (config.agent) {
            case 'chatgpt':
                this.client = await chatGptAgent.init() 
                break;
        }
    },

    /**
     * Plan prompt preparation
     *
     * @param {*} inputText
     * @returns {string} preparedPlanInput
     */
    prepareGatherFactsPrompt: function ({inputText, manifests}) {
        const commandLists = [];
        const schemaLists = [];

        manifests.manifests.forEach((manifest) => {
            if (manifest.manifest.commandList?.[0] && manifest.manifest.commandList[0].includes('agentService')) {
                return;
            }

            commandLists.push(manifest.manifest.commandList);
            schemaLists.push(manifest.manifest.schemas);
        });

        const preparedPlanInput = JSON.stringify({
            clientPrompt: inputText,
            systemInstructions: "Respond to the clientPrompt in the format of the responseStructure JSON. Your sole aim is to confirm (using the commandsRequired response property) which commands described in the manifest you will need more information on (command signature), in order to be able to invoke the commands to fulfill the request provided in the clientPrompt. Simillarly, please ensure that you request all required information as per the schema manifest from the user in the responseText. If there aren't suitable commands, explain that you can't with no further options. If it is not yet clear, please request clarification. The responseText will be shown to the customer so ensure that responses are non-technical and don't go into detail about the rest of the response.",
            responseStructure: {
                responseText: "Customer facing message reply here",
                commandsRequired: [
                    'e.g. userService.create',
                    'userService.update'
                ]
            },
            commandManifest: commandLists,
            schemaManifest: schemaLists
        });

        logger.info(preparedPlanInput);

        return preparedPlanInput;
    },

    /**
     * Plan prompt preparation
     *
     * @param {*} inputText
     * @returns {string} preparedPlanInput
     */
    preparePlanPrompt: function ({inputText, manifests}) {
        const commandLists = [];
        const schemaLists = [];

        manifests.manifests.forEach((manifest) => {
            if (manifest.manifest.commandList?.[0] && manifest.manifest.commandList[0].includes('agentService')) {
                return;
            }

            commandLists.push(manifest.manifest.commandList);
            schemaLists.push(manifest.manifest.schema);
        });

        const preparedPlanInput = JSON.stringify({
            clientPrompt: inputText,
            systemInstructions: "Respond to the clientPrompt in the format of the responseStructure JSON. Your sole aim is to confirm using the commandsRequired response property, which commands described in the manifest you will need more information, in order to be able to invoke the commands to fulfill the request provided in the clientPrompt. If there aren't suitable commands, explain that you can't with no further options. If it is not yet clear, please request clarification. The responseText will be shown to the customer so ensure that responses are non-technical and don't go into detail about the rest of the response.",
            responseStructure: {
                responseText: "Customer facing message reply here",
                actionPlan: [
                    {
                        planDesc: "Fetch the user ID using the email address provided",
                        commandName: "userService.getSingle"
                    },
                    {
                        planDesc: "update the users first name as requested",
                        commandName: "userService.update"
                    }
                ],
                commandsRequired: [
                    'e.g. userService.create',
                    'userService.update'
                ]
            },
            commandManifest: commandLists,
            schemaManifest: schemaLists
        });

        logger.info(preparedPlanInput);

        return preparedPlanInput;
    },


    /**
     * Action plan step prompt preparation
     *
     * @param {*} inputText
     * @returns {string} preparedActionPlanStepPrompt
     */
    preparedActionPlanStepPrompt: function ({actionPlanStepDesc, manifest}) {

    },

    /**
     * Prompt augmentation for the agent
     * 
     * @param {*} inputText 
     * @returns {string} preparedInput
     */
    preparePrompt: function ({inputText}) {
        const preparedInput = JSON.stringify({
            clientPrompt: inputText,
            systemInstructions: "Respond to the clientPrompt in the the format of the responseStructure JSON. If there is an appropriate flow of actions to take based on the actions described in the registeredServices you should respond with a command otherwise don't. You should always include a customer facing message requesting clarifications or the action taken.",
            responseStructure: {
                responseText: "Your message here",
                action: {
                    commandName: "e.g. userService.update",
                    payload: {
                        userId: "12345",
                        data: {}
                    }
                }
            },
            registeredServices: [
                {
                    serviceName: "userService",
                    actions: [
                        {
                            name: "update",
                            description: "Update user information",
                            parameters: {
                                userId: "string",
                                data: "object"
                            }
                        }
                    ]
                }
            ]
        })

        return preparedInput;
    },

    /**
     * Create a new chat session
     * 
     * @param {string} userId 
     * @param {string} title 
     * @param {string} sessionKey
     * @returns {string} chatId
     */
    createChat: async function ({userId, title, sessionKey}) {
        const chatId = utils.uuid();

        await db.query(
            'INSERT INTO agent_chats (id, user_id, title) VALUES (?, ?, ?)',
            [chatId, userId, title]
        );

        return chatId;
    },

    /**
     * Get a chat (with all messages) 
     *
     * @param {string} chatId
     * @returns {object} chat
     */
    getChat: async function ({chatId}) {
        try {
            // Fetch the chat
            const chatResult = await db.query(
                'SELECT * FROM agent_chats WHERE id = ?',
                [chatId]
            );

            if (!chatResult || chatResult.length === 0) {
                throw new Error(`Chat with ID ${chatId} not found`);
            }

            const chat = chatResult[0][0];

            // Fetch messages for the chat
            const chatMessageResult = await db.query(
                'SELECT id, chat_id, user_name, context, created_at FROM agent_chat_messages WHERE chat_id = ? ORDER BY created_at ASC',
                [chatId]
            );

            if (!chatMessageResult || chatMessageResult.length === 0) {
                throw new Error('No chat messages found');
            }

            chat.messages = chatMessageResult[0];

            return chat;
        } catch (err) {
            logger.error(`Error fetching chat ${chatId}: ${err.message}`);
            throw err;
        }
    },

    /**
     * Create a new chat message
     * 
     * @param {string} chatId
     * @param {string} userName
     * @param {object} context
     */
    createChatMessage: async function ({chatId, userName, context}) {
        try {
            const messageId = utils.uuid();
            context = JSON.stringify(context);

            logger.info('storing context: ' + context);

            await db.query(
                'INSERT INTO agent_chat_messages (id, chat_id, user_name, context) VALUES (?, ?, ?, ?)',
                [messageId, chatId, userName, context]
            );
        } catch (err) {
            logger.error('Error creating chat message: ' + err.message);
        }
    },

    /**
     * Infer LLM agent
     *
     * @param {string} preparedInput
     * @returns {string} response
     */
    infer: async function ({preparedInput}) {

        let response;
        
        switch (config.agent) {
            case 'chatgpt':
                response = await chatGptAgent.getResponse(preparedInput) 
                break;
        }

        return response;
    }

};
