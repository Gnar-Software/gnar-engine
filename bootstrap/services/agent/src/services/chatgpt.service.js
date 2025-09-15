import OpenAI from "openai";
import { logger } from "gnarengine-service-core";


export const chatGptAgent = {

    client: null,

    init: function () {
        if (this.client) {
            return this.client;
        }

        return this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
        });
    },

    getResponse: async function (preparedInput) {
        try {
            logger.info('LLM request sending...');
            const response = await this.client.chat.completions.create({
                model: "gpt-5-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: preparedInput
                            }
                        ],
                    },
                ],
            });

            logger.info('LLM response returned');

            return response.choices[0].message.content;
        } catch (error) {
            logger.error("ChatGPT agent error:" + error);
            throw error;
        }
    }
}
