import { useEffect, useMemo, useRef, useState } from "react";
import {
    getAgentChats,
    getAgentChatHistory,
    getAgentWebSocketUrl,
    promptAgent,
    resolveAgentApproval
} from "../../services/agent.js";

function AgentInterface({ initialPrompt, onInitialPromptHandled, visible = true }) {
    const [chats, setChats] = useState([]);
    const [activeChatKey, setActiveChatKey] = useState(null);
    const [draft, setDraft] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [isSending, setIsSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const socketRef = useRef(null);
    const handledPromptRef = useRef(null);
    const chatsRef = useRef(chats);
    const activeChatKeyRef = useRef(activeChatKey);
    const loadedChatsRef = useRef(false);
    const reconnectTimerRef = useRef(null);

    const activeChat = useMemo(() => {
        return chats.find(chat => chat.localKey === activeChatKey) || null;
    }, [activeChatKey, chats]);

    const updateChat = (localKey, updater) => {
        setChats(currentChats => currentChats.map(chat => {
            if (chat.localKey !== localKey) {
                return chat;
            }

            return updater(chat);
        }));
    };

    const createChat = (firstMessage = '') => {
        const localKey = crypto.randomUUID();
        const title = firstMessage ? firstMessage.substring(0, 80) : 'New agent chat';
        const chat = {
            localKey,
            chatId: null,
            title,
            status: 'idle',
            runId: null,
            pendingApproval: null,
            activityMessage: null,
            messages: []
        };

        setChats(currentChats => [chat, ...currentChats]);
        setActiveChatKey(localKey);

        return chat;
    };

    const mergeMessage = (chat, message) => {
        const existingIndex = chat.messages.findIndex(item => item.id === message.id);

        if (existingIndex === -1) {
            return {
                ...chat,
                messages: [...chat.messages, message]
            };
        }

        const messages = [...chat.messages];
        messages[existingIndex] = {
            ...messages[existingIndex],
            ...message
        };

        return {
            ...chat,
            messages
        };
    };

    const mapStoredMessage = message => ({
        id: `history-${message.id}`,
        role: message.role,
        content: message.content?.text || message.content?.error || JSON.stringify(message.content),
        status: 'complete',
        createdAt: message.createdAt
    });

    const mapStoredMessages = messages => {
        return (messages || [])
            .filter(message => ['user', 'assistant'].includes(message.role))
            .filter(message => message.content?.text)
            .map(mapStoredMessage);
    };

    const findChatKeyForEvent = event => {
        const foundChat = chatsRef.current.find(chat => chat.chatId === event.chatId || chat.runId === event.runId);
        return foundChat?.localKey || activeChatKeyRef.current;
    };

    const applyAgentEvent = event => {
        if (!event?.type) {
            return;
        }

        const chatKey = findChatKeyForEvent(event);

        if (!chatKey) {
            return;
        }

        updateChat(chatKey, chat => {
            const nextChat = {
                ...chat,
                chatId: event.chatId || chat.chatId,
                runId: event.runId || chat.runId
            };

            if (event.type === 'agent.started') {
                return {
                    ...nextChat,
                    status: 'running',
                    pendingApproval: null,
                    activityMessage: 'thinking...'
                };
            }

            if (event.type === 'agent.text.delta') {
                return mergeMessage(nextChat, {
                    id: `assistant-${event.runId}`,
                    role: 'assistant',
                    content: event.text,
                    status: 'complete',
                    createdAt: event.timestamp
                });
            }

            if (event.type === 'agent.tool.started') {
                return {
                    ...nextChat,
                    activityMessage: event.toolName
                };
            }

            if (event.type === 'agent.tool.completed') {
                return nextChat;
            }

            if (event.type === 'agent.approval.requested') {
                return {
                    ...mergeMessage(nextChat, {
                        id: `approval-${event.stepId}`,
                        role: 'approval',
                        content: `${event.toolName} needs approval`,
                        status: 'waiting_for_approval',
                        createdAt: event.timestamp
                    }),
                    status: 'waiting_for_approval',
                    pendingApproval: {
                        runId: event.runId,
                        stepId: event.stepId,
                        toolName: event.toolName
                    }
                };
            }

            if (event.type === 'agent.completed') {
                return {
                    ...nextChat,
                    status: 'completed',
                    pendingApproval: null,
                    activityMessage: null
                };
            }

            if (event.type === 'agent.error') {
                return mergeMessage({
                    ...nextChat,
                    status: 'failed',
                    pendingApproval: null
                }, {
                    id: `error-${event.runId || Date.now()}`,
                    role: 'system',
                    content: event.error || 'The agent run failed.',
                    status: 'failed',
                    createdAt: event.timestamp
                });
            }

            return nextChat;
        });
    };

    const submitPrompt = async (input, chatOverride = null) => {
        const trimmedInput = input.trim();

        if (!trimmedInput || isSending) {
            return;
        }

        const targetChat = chatOverride || activeChat || createChat(trimmedInput);
        setErrorMessage('');
        setIsSending(true);

        updateChat(targetChat.localKey, chat => ({
            ...mergeMessage(chat, {
                id: `user-${Date.now()}`,
                role: 'user',
                content: trimmedInput,
                status: 'complete',
                createdAt: new Date().toISOString()
            }),
            status: 'running',
            title: chat.title === 'New agent chat' ? trimmedInput.substring(0, 80) : chat.title
        }));

        try {
            const result = await promptAgent({
                input: trimmedInput,
                chatId: targetChat.chatId
            });

            updateChat(targetChat.localKey, chat => {
                let nextChat = {
                    ...chat,
                    chatId: result.chatId || chat.chatId,
                    runId: result.runId || chat.runId,
                    status: result.status || chat.status
                };

                if (result.responseText) {
                    nextChat = mergeMessage(nextChat, {
                        id: `assistant-${result.runId}`,
                        role: 'assistant',
                        content: result.responseText,
                        status: 'complete',
                        createdAt: new Date().toISOString()
                    });
                }

                if (result.status === 'waiting_for_approval' && result.toolCalls?.[0]) {
                    const pendingToolCall = result.toolCalls[0];
                    const stepId = pendingToolCall.stepId || pendingToolCall.id;
                    nextChat.pendingApproval = {
                        runId: result.runId,
                        stepId,
                        toolName: pendingToolCall.toolName || pendingToolCall.toolCall?.toolName
                    };
                }

                return nextChat;
            });
        } catch (err) {
            const message = err?.message || 'Unable to submit the agent prompt.';
            setErrorMessage(message);
            updateChat(targetChat.localKey, chat => mergeMessage({
                ...chat,
                status: 'failed'
            }, {
                id: `error-${Date.now()}`,
                role: 'system',
                content: message,
                status: 'failed',
                createdAt: new Date().toISOString()
            }));
        } finally {
            setIsSending(false);
        }
    };

    const submitDraft = event => {
        event.preventDefault();
        const nextDraft = draft;
        setDraft('');
        submitPrompt(nextDraft);
    };

    const startNewChat = () => {
        createChat();
        setDraft('');
    };

    const loadChatHistory = async chat => {
        if (!chat.chatId) {
            setActiveChatKey(chat.localKey);
            return;
        }

        setActiveChatKey(chat.localKey);

        try {
            const history = await getAgentChatHistory({ chatId: chat.chatId });
            updateChat(chat.localKey, currentChat => ({
                ...currentChat,
                title: history.title || currentChat.title,
                messages: mapStoredMessages(history.messages)
            }));
        } catch (err) {
            setErrorMessage(err?.message || 'Unable to load chat history.');
        }
    };

    const loadChats = async () => {
        if (loadedChatsRef.current) {
            return;
        }

        loadedChatsRef.current = true;

        try {
            const result = await getAgentChats();
            let savedChats = (result.chats || []).map(chat => ({
                localKey: chat.id,
                chatId: chat.id,
                title: chat.title || 'Agent chat',
                status: chat.status || 'idle',
                runId: null,
                pendingApproval: null,
                activityMessage: null,
                messages: []
            }));
            const shouldSelectFirstChat = !activeChatKeyRef.current && savedChats.length;

            if (shouldSelectFirstChat) {
                const history = await getAgentChatHistory({ chatId: savedChats[0].chatId });
                savedChats[0] = {
                    ...savedChats[0],
                    title: history.title || savedChats[0].title,
                    messages: mapStoredMessages(history.messages)
                };
            }

            setChats(currentChats => {
                const unsavedChats = currentChats.filter(chat => !chat.chatId);
                return [...unsavedChats, ...savedChats];
            });

            if (shouldSelectFirstChat) {
                setActiveChatKey(savedChats[0].localKey);
            }
        } catch (err) {
            loadedChatsRef.current = false;
            setErrorMessage(err?.message || 'Unable to load agent chats.');
        }
    };

    const resolveApproval = async approved => {
        if (!activeChat?.pendingApproval) {
            return;
        }

        const approval = activeChat.pendingApproval;
        updateChat(activeChat.localKey, chat => ({
            ...chat,
            status: 'running',
            pendingApproval: null
        }));

        try {
            await resolveAgentApproval({
                runId: approval.runId,
                stepId: approval.stepId,
                approved,
                approvalComment: approved ? 'Approved from portal admin interface' : 'Rejected from portal admin interface'
            });
        } catch (err) {
            setErrorMessage(err?.message || 'Unable to resolve approval.');
        }
    };

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    useEffect(() => {
        activeChatKeyRef.current = activeChatKey;
    }, [activeChatKey]);

    useEffect(() => {
        if (!visible) {
            return undefined;
        }

        loadChats();

        let shouldReconnect = true;

        const scheduleReconnect = () => {
            if (!shouldReconnect || reconnectTimerRef.current) {
                return;
            }

            reconnectTimerRef.current = window.setTimeout(() => {
                reconnectTimerRef.current = null;
                connectSocket();
            }, 1500);
        };

        const connectSocket = () => {
            setConnectionStatus('connecting');

            const socket = new WebSocket(getAgentWebSocketUrl());
            socketRef.current = socket;

            socket.addEventListener('open', () => {
                if (socketRef.current === socket) {
                    setConnectionStatus('connected');
                }
            });
            socket.addEventListener('close', () => {
                if (socketRef.current !== socket) {
                    return;
                }

                setConnectionStatus('disconnected');
                scheduleReconnect();
            });
            socket.addEventListener('error', () => {
                if (socketRef.current !== socket) {
                    return;
                }

                setConnectionStatus('disconnected');
                socket.close();
            });
            socket.addEventListener('message', message => {
                try {
                    const event = JSON.parse(message.data);
                    console.log('Received agent event', event);
                    applyAgentEvent(event.event || event);
                } catch (err) {
                    console.warn('Unable to parse agent websocket event', err);
                }
            });
        };

        connectSocket();

        return () => {
            shouldReconnect = false;

            if (reconnectTimerRef.current) {
                window.clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }

            const socket = socketRef.current;
            socketRef.current = null;
            socket?.close();
        };
    }, [visible]);

    useEffect(() => {
        if (!initialPrompt || handledPromptRef.current === initialPrompt.id) {
            return;
        }

        handledPromptRef.current = initialPrompt.id;
        const chat = activeChat || createChat(initialPrompt.text);
        submitPrompt(initialPrompt.text, chat);
        onInitialPromptHandled?.();
    }, [initialPrompt]);

    if (!visible) {
        return null;
    }

    return (
        <div className="agent-interface">
            <aside className="agent-chat-list">
                <div className="agent-chat-list-header">
                    <span>Agent Chats</span>
                    <button type="button" onClick={startNewChat}>New</button>
                </div>
                <ul>
                    {chats.map(chat => (
                        <li key={chat.localKey}>
                            <button
                                type="button"
                                className={chat.localKey === activeChatKey ? 'active' : ''}
                                onClick={() => loadChatHistory(chat)}
                            >
                                <span>{chat.title}</span>
                                <small>{chat.status}</small>
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>
            <section className="agent-chat-panel">
                <div className="agent-chat-toolbar">
                    <div>
                        <h1>{activeChat?.title || 'Admin Agent'}</h1>
                        <span className={`agent-connection agent-connection-${connectionStatus}`}>{connectionStatus}</span>
                    </div>
                    {errorMessage ? <p>{errorMessage}</p> : null}
                </div>
                <div className="agent-messages">
                    {activeChat?.messages?.length ? activeChat.messages.map(message => (
                        <article key={message.id} className={`agent-message agent-message-${message.role}`}>
                            <span>{message.role}</span>
                            <p>{message.content}</p>
                        </article>
                    )) : null}
                    {activeChat?.activityMessage ? (
                        <article className="agent-status-message"> 
                            <p>{activeChat.activityMessage}</p>
                        </article>
                    ) : null}
                    {!activeChat?.messages?.length && !activeChat?.activityMessage ? (
                        <div className="agent-empty-state">
                            <h2>Ask the agent to help.</h2>
                        </div>
                    ) : null}
                </div>
                {activeChat?.pendingApproval ? (
                    <div className="agent-approval-bar">
                        <span>{activeChat.pendingApproval.toolName} is waiting for approval.</span>
                        <div>
                            <button type="button" onClick={() => resolveApproval(true)}>Approve</button>
                            <button type="button" className="secondary-btn" onClick={() => resolveApproval(false)}>Reject</button>
                        </div>
                    </div>
                ) : null}
                <form className="agent-chat-input" onSubmit={submitDraft}>
                    <textarea
                        value={draft}
                        onChange={event => setDraft(event.target.value)}
                        placeholder="Message the agent"
                        rows="3"
                    />
                    <button type="submit" disabled={isSending || !draft.trim()}>
                        {isSending ? 'Sending' : 'Send'}
                    </button>
                </form>
            </section>
        </div>
    );
}

export default AgentInterface;
