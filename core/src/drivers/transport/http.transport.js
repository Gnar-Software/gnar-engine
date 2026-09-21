import { randomUUID } from 'node:crypto';

export const httpTransport = {

    name: 'http',
    url: '',
    token: '',
    tokenHeader: '',
    timeoutMs: 5000,
    maxRetries: 3,
    retryBaseMs: 250,

    /**
     * Configure the transport.
     *
     * Nothing here is Gnar Cloud specific — the endpoint, the header name and the token are all
     * parameters, so a third party can point this at their own collector.
     *
     * @param {Object} params
     * @param {string} params.url - Ingestion endpoint to POST batches to.
     * @param {string} params.token - Token authenticating this sender.
     * @param {string} params.tokenHeader - Header the token is sent in.
     * @param {number} [params.timeoutMs] - Per-request timeout.
     * @param {number} [params.maxRetries] - Retries after the first attempt, for 5xx and network failures.
     * @returns {void}
     */
    init: ({ url, token, tokenHeader, timeoutMs, maxRetries }) => {
        // No sensible default exists for these three - a missing one means the transport
        // cannot deliver anywhere, which is worth failing loudly on.
        if (!url || !token || !tokenHeader) {
            throw new Error('Log transport requires url, token and tokenHeader');
        }

        httpTransport.url = url;
        httpTransport.token = token;
        httpTransport.tokenHeader = tokenHeader;
        httpTransport.timeoutMs = timeoutMs || 5000;
        httpTransport.maxRetries = maxRetries || 3;
    },

    /**
     * Deliver one batch of log events.
     *
     * Resolves once the batch is accepted. Rejects when it cannot be delivered, which is the
     * logger's signal to fall back to stdout — so a rejection loses nothing.
     *
     * The POST body is `{ batchId, events }`; batchId is stable across retries of one batch.
     *
     * @param {Object} params
     * @param {Array<Object>} params.batch - Structured log events.
     * @returns {Promise<void>}
     */
    send: async ({ batch }) => {
        // Test framework output is not tenant logging and has no place in the log store.
        const events = batch.filter(log => log.level !== 'test_result');

        if (events.length === 0) {
            return;
        }

        // One id for this batch, generated once and reused across every retry of it. A retry
        // after a lost response carries the same id, so the collector can recognise it as a
        // duplicate rather than writing every line twice.
        const body = JSON.stringify({ batchId: randomUUID(), events });

        for (let attempt = 0; attempt <= httpTransport.maxRetries; attempt++) {

            // Back off exponentially before each retry so a struggling gateway is not hammered.
            if (attempt > 0) {
                const delay = httpTransport.retryBaseMs * (2 ** (attempt - 1));
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // A hung gateway must not hold the flush open; the abort surfaces as a network
            // failure and is retried like any other.
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), httpTransport.timeoutMs);
            let status = 0;

            try {
                const response = await fetch(httpTransport.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        [httpTransport.tokenHeader]: httpTransport.token
                    },
                    body: body,
                    signal: controller.signal
                });

                status = response.status;
            } catch (err) {
                // Network failure or the timeout aborting. Both are retryable, so fall through
                // with a status this loop treats as "not delivered".
                status = 0;
            } finally {
                clearTimeout(timer);
            }

            if (status >= 200 && status < 300) {
                return;
            }

            // A 4xx is a bad token or a bad payload. No number of retries fixes that, and
            // retrying forever would only burn the buffer, so give up immediately.
            // console.error, never the engine logger — logging a logging failure would loop.
            if (status >= 400 && status < 500) {
                console.error(`[gnar-logger] ingestion rejected ${events.length} events with status ${status}, falling back to stdout`);
                throw new Error(`Log ingestion rejected with status ${status}`);
            }
        }

        console.error(`[gnar-logger] ingestion unreachable after ${httpTransport.maxRetries} retries, ${events.length} events fall back to stdout`);
        throw new Error('Log ingestion unreachable');
    },

    /**
     * Release the transport. fetch holds nothing open, so there is nothing to tear down.
     *
     * @returns {Promise<void>}
     */
    close: async () => {
    }
}
