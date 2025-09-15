import client from "../services/client.js";

export const agent = {

    prompt: async (input, chatId) => {
        try {
            const response = await client.post('/agent/prompt', {
                textInput: input,
                chatId: chatId
            });

            if (response.status !== 200) {
                throw new Error("Failed to prompt agent");
            }

            //console.log("Agent response: " + response.data);

            return response.data;
        } catch (error) {
            // get response message if available
            if (error?.response?.data?.error) {
                return {error: error.response.data.error};
            }

            return {error: "Agent prompt failed: " + error};
        }
    }
}
