// control/commands.js
import { Command } from 'commander';
import inquirer from 'inquirer';
import { agent } from './agent.client.js';
import { v4 as uuidv4 } from 'uuid';

export function registerAgentCommands(program) {
	const agentCmd = new Command('agent').description('🤖 LLM Agent Commands');

	agentCmd
		.command('session')
		.description('🤖 Prompt the Engine Agent')
		.action(async (options) => {
            let chatId;

			while (true) {
				const input = await inquirer.prompt([
					{ 
            			type: 'text',
						name: 'prompt',
						message: 'Enter your prompt (or type "exit" to quit):'
					},
				]);

				if (input.prompt.toLowerCase() === 'exit') {
					console.log('Exiting Engine agent.');
					break;
				}

				try {
					const response = await agent.prompt(input.prompt, chatId);

					if (response.error) {
						console.error('❌ ' + response.error);
					} else if (!response.structuredResponse?.responseText) {
                        console.error('❌ Error parsing reply');
                    } else {
						console.log(response.structuredResponse.responseText);
                        chatId = response.chatId;
					}
				} catch (error) {
					console.error('❌ Error prompting agent:', error.message);
				}
			}
		});

	program.addCommand(agentCmd);
}
