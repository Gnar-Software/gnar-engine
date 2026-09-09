export const loggerService = {

    serviceName: '',
    context: {},
    logs: [],
    transports: [],
    flushIntervalMs: 5000,
    batchSize: 500,
    maxBatchBytes: 800 * 1024,
    maxBufferSize: 10000,
    timer: null,
    flushing: false,
    overflowed: false,
    shutdownRegistered: false,

    /**
     * Initialise the logger.
     *
     * With no transports the logger writes straight to stdout, which is the default behaviour
     * for every Gnar Engine application. Transports switch it to batching.
     *
     * @param {Object} params
     * @param {string} params.serviceName - Name of the owning service.
     * @param {Array<Object>} [params.transports] - Transports to deliver batches through.
     * @param {number} [params.flushIntervalMs] - How often the buffer is drained.
     * @param {number} [params.batchSize] - Maximum events handed to a transport in one send.
     * @param {number} [params.maxBatchBytes] - Maximum serialised size of one send.
     * @param {number} [params.maxBufferSize] - Buffer cap, beyond which events spill to stdout.
     * @param {Object} [params.context] - Tenant context attached to every event.
     * @returns {void}
     */
    init: ({ serviceName, transports, flushIntervalMs, batchSize, maxBatchBytes, maxBufferSize, context }) => {
        if (!serviceName) {
            throw new Error('Service name is required for logger initialization');
        }

        loggerService.serviceName = serviceName;
        loggerService.transports = transports || [];
        loggerService.flushIntervalMs = flushIntervalMs || 2000;
        loggerService.batchSize = batchSize || 500;
        loggerService.maxBatchBytes = maxBatchBytes || 800 * 1024;
        loggerService.maxBufferSize = maxBufferSize || 10000;
        loggerService.context = context || {};

        // Nothing to batch without a transport, so no timer is started and nothing holds the
        // event loop open. Default stdout behaviour is unchanged.
        if (loggerService.transports.length > 0) {
            loggerService.startFlushTimer();
            loggerService.registerShutdownHandlers();
        }
    },

    info: (args1, args2, args3, args4) => {
        loggerService.addLog({ args1, args2, args3, args4, level: 'info' });
    },

    warning: (args1, args2, args3, args4) => {
        loggerService.addLog({ args1, args2, args3, args4, level: 'warning' });
    },

    error: (args1, args2, args3, args4) => {
        loggerService.addLog({ args1, args2, args3, args4, level: 'error' });
    },

    table: (args1, args2, args3, args4) => {
        loggerService.addLog({ args1, args2, args3, args4, level: 'table' });
    },

    testResult: (test, testResult, message) => {
        loggerService.addLog({
            args1: message,
            level: 'test_result',
            testResult,
            test
        });
    },

    /**
     * Register a transport.
     *
     * A transport is `{ name, init({ ... }), send({ batch }), close() }`. `send` resolves once
     * the batch is delivered and rejects otherwise; a rejected batch falls back to stdout.
     *
     * @param {Object} params
     * @param {Object} params.transport - The transport to register.
     * @returns {void}
     */
    addTransport: ({ transport }) => {
        if (!transport || typeof transport.send !== 'function' || typeof transport.close !== 'function') {
            throw new Error('A logger transport must implement send({ batch }) and close()');
        }

        loggerService.transports.push(transport);

        // The first transport switches the logger from stdout to batching, so start draining
        // if init did not already (a transport can be registered after boot).
        if (!loggerService.timer) {
            loggerService.startFlushTimer();
            loggerService.registerShutdownHandlers();
        }
    },

    addLog: ({ args1, args2, args3, args4, level, testResult, test }) => {
        const args = [args1, args2, args3, args4].filter(arg => arg !== undefined);
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return '[Object]';
                }
            } else {
                return String(arg);
            }
        }).join(' ');

        // Tenant context travels with the event so a batch is self-describing once it leaves
        // the process. Outside Gnar Cloud these are undefined and never reach a transport.
        const log = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            accountId: loggerService.context.accountId,
            projectId: loggerService.context.projectId,
            environmentName: loggerService.context.environmentName,
            serviceName: loggerService.serviceName,
            sourceType: loggerService.context.sourceType,
            deploymentId: loggerService.context.deploymentId,
            metadata: {}
        };

        // Test framework fields ride in metadata rather than as columns of their own.
        if (test !== undefined) {
            log.metadata.test = test;
            log.metadata.testResult = testResult;
        }

        // No transports configured — stdout is the sink.
        if (loggerService.transports.length === 0) {
            loggerService.writeToConsole({ log });
            return;
        }

        // Bounded buffer. A logging outage must never grow the heap until the service dies, so
        // past the cap events spill to stdout instead of accumulating. Warn once per episode
        // rather than per event, or the warning is as noisy as the logs it replaces.
        if (loggerService.logs.length >= loggerService.maxBufferSize) {
            if (!loggerService.overflowed) {
                loggerService.overflowed = true;
                process.stderr.write(`[gnar-logger] buffer full at ${loggerService.maxBufferSize} events, spilling to stdout\n`);
            }

            loggerService.writeToConsole({ log });
            return;
        }

        loggerService.overflowed = false;
        loggerService.logs.push(log);
    },

    /**
     * Write one event straight to stdout. The default sink, and the fallback whenever a
     * transport cannot take delivery.
     *
     * @param {Object} params
     * @param {Object} params.log - The structured log event.
     * @returns {void}
     */
    writeToConsole: ({ log }) => {
        // Tables keep their console.table rendering so local development is unchanged.
        if (log.level === 'table') {
            try {
                console.table(JSON.parse(log.message));
            } catch {
                console.log('[table] unable to parse table data:', log.message);
            }

            return;
        }

        console.log(loggerService.formatForConsole(log));
    },

    startFlushTimer() {
        if (loggerService.timer) {
            clearInterval(loggerService.timer);
        }
        loggerService.timer = setInterval(() => loggerService.flush(), loggerService.flushIntervalMs);
    },

    /**
     * Take the next batch off the buffer, bounded by both event count and serialised size.
     *
     * Size matters as much as count: 500 events of ordinary log lines are ~200KB, but 500
     * stack traces are several megabytes, which a collector will refuse - and a refusal is a
     * 4xx, which is never retried. Capping here keeps every request bounded by construction.
     *
     * @returns {Array<Object>} Events to send, removed from the buffer.
     */
    takeBatch: () => {
        const batch = [];
        let bytes = 0;

        while (loggerService.logs.length > 0 && batch.length < loggerService.batchSize) {
            const log = loggerService.logs[0];
            const size = Buffer.byteLength(JSON.stringify(log));

            // A single event larger than the whole cap would stall the buffer forever, so
            // truncate its message down to something that fits rather than stalling or
            // dropping it.
            if (size > loggerService.maxBatchBytes && batch.length === 0) {
                const room = loggerService.maxBatchBytes - (size - Buffer.byteLength(log.message)) - 64;
                log.message = `${log.message.slice(0, room)} … [truncated]`;
                batch.push(loggerService.logs.shift());
                break;
            }

            // Adding this one would take the request over the cap, so it starts the next.
            if (bytes + size > loggerService.maxBatchBytes && batch.length > 0) {
                break;
            }

            bytes += size;
            batch.push(loggerService.logs.shift());
        }

        return batch;
    },

    /**
     * Drain the buffer through every registered transport.
     *
     * @returns {Promise<void>}
     */
    flush: async () => {
        // A drain is already running and will pick up anything added since it started, so a
        // slow send can never overlap the next tick.
        if (loggerService.flushing || loggerService.logs.length === 0) {
            return;
        }

        loggerService.flushing = true;

        try {
            // Chunk the buffer so a quiet period followed by a burst cannot turn into one
            // enormous request.
            while (loggerService.logs.length > 0) {
                const batch = loggerService.takeBatch();

                const results = await Promise.allSettled(
                    loggerService.transports.map(transport => transport.send({ batch }))
                );

                // Nothing took delivery, so fall back to stdout rather than dropping the batch.
                // Transports report their own failures on stderr; logging a logging failure
                // through the logger would be an infinite loop.
                if (results.every(result => result.status === 'rejected')) {
                    batch.forEach(log => loggerService.writeToConsole({ log }));
                }
            }
        } finally {
            loggerService.flushing = false;
        }
    },

    /**
     * Drain the buffer and release every transport.
     *
     * @returns {Promise<void>}
     */
    close: async () => {
        if (loggerService.timer) {
            clearInterval(loggerService.timer);
            loggerService.timer = null;
        }

        await loggerService.flush();

        await Promise.allSettled(
            loggerService.transports.map(transport => transport.close())
        );
    },

    /**
     * Flush before the process goes away. Without this every rolling deploy loses up to one
     * flush interval of logs, on every pod.
     *
     * @returns {void}
     */
    registerShutdownHandlers: () => {
        if (loggerService.shutdownRegistered) {
            return;
        }

        loggerService.shutdownRegistered = true;

        ['SIGTERM', 'SIGINT'].forEach(signal => {
            // once(), so re-raising afterwards reaches Node's default handler and the process
            // terminates exactly as it would have without the logger attached.
            process.once(signal, async () => {
                await loggerService.close();
                process.kill(process.pid, signal);
            });
        });
    },

    formatForConsole: (log) => {
        const LEVEL_WIDTH = 12;

        const colors = {
            error: '\x1b[31m',   // red
            warning: '\x1b[33m', // yellow
            reset: '\x1b[0m'
        };

        const time = new Date(log.timestamp).toISOString();
        const levelText = (log.level || 'info').toUpperCase();
        const paddedLevel = levelText.padEnd(LEVEL_WIDTH);

        let line = `${time} ${paddedLevel} — ${log.message}`;

        const color = colors[log.level] || '';
        const reset = color ? colors.reset : '';

        return `${color}${line}${reset}`;
    }
}
