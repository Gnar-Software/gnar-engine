import client from './client.js';
import { getAuthToken } from './storage.js';

const localAgentPort = '4006';

export function getAgentWebSocketUrl() {
    if (import.meta.env.VITE_AGENT_WS_URL) {
        return import.meta.env.VITE_AGENT_WS_URL;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname || 'localhost';
    const isLocalHost = ['localhost', '127.0.0.1'].includes(hostname);
    const port = isLocalHost ? localAgentPort : window.location.port;
    const portSegment = port ? `:${port}` : '';
    const token = getAuthToken();
    const authQuery = token ? `?token=${encodeURIComponent(token)}` : '';

    return `${protocol}//${hostname}${portSegment}/agent/ws${authQuery}`;
}

export async function promptAgent({ input, chatId }) {
    const response = await client.post('/agent/prompt', {
        input,
        chatId
    });

    return response.data;
}

export async function resolveAgentApproval({ runId, stepId, approved, approvalComment }) {
    const response = await client.post(`/agent/approvals/${runId}/${stepId}`, {
        approved,
        approvalComment
    });

    return response.data;
}

export async function getAgentChatHistory({ chatId }) {
    const response = await client.get(`/agent/chats/${chatId}`);

    return response.data;
}

export async function getAgentChats() {
    const response = await client.get('/agent/chats');

    return response.data;
}
