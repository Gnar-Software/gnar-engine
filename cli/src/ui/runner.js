import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliEntrypoint = path.resolve(__dirname, '..', 'cli.js');

const processRegistry = new Map();
let nextProcessId = 1;

function quoteArg(value) {
    if (value === '') {
        return "''";
    }

    if (!/[\s'"$`\\]/.test(value)) {
        return value;
    }

    return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildArgv(commandDef, selections) {
    const argv = [commandDef.group, commandDef.command];

    for (const argDef of commandDef.args) {
        const value = selections.args[argDef.key];
        if (value !== undefined && value !== null && String(value).length > 0) {
            argv.push(String(value));
        }
    }

    for (const optionDef of commandDef.options) {
        const value = selections.options[optionDef.key];

        if (optionDef.type === 'boolean') {
            if (value) {
                argv.push(optionDef.flag);
            }
            continue;
        }

        if (value !== undefined && value !== null && String(value).length > 0) {
            argv.push(optionDef.flag, String(value));
        }
    }

    return argv;
}

export function buildPreview(commandDef, selections) {
    const argv = buildArgv(commandDef, selections);
    return ['gnar', ...argv.map(quoteArg)].join(' ');
}

export function getProcessRegistry() {
    return processRegistry;
}

export function killProcess(processId) {
    const entry = processRegistry.get(processId);
    if (!entry || entry.status !== 'running') return false;
    entry.child.kill('SIGTERM');
    return true;
}

export function dismissProcess(processId) {
    const entry = processRegistry.get(processId);
    if (entry?.status === 'running') return false;
    processRegistry.delete(processId);
    return true;
}

export function spawnPersistent(commandDef, selections, onUpdate) {
    const processId = nextProcessId++;
    const argv = buildArgv(commandDef, selections);
    const preview = buildPreview(commandDef, selections);

    const child = spawn(process.execPath, [cliEntrypoint, ...argv], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env
    });

    const entry = {
        processId,
        preview,
        child,
        output: '',
        status: 'running',
        code: null,
        startedAt: Date.now()
    };

    processRegistry.set(processId, entry);

    let lastNotify = 0;
    const notify = () => {
        const now = Date.now();
        if (now - lastNotify > 80) {
            lastNotify = now;
            onUpdate?.(processId, entry);
        }
    };

    child.stdout.on('data', (chunk) => {
        entry.output += chunk.toString();
        notify();
    });

    child.stderr.on('data', (chunk) => {
        entry.output += chunk.toString();
        notify();
    });

    child.on('close', (code) => {
        entry.status = code === 0 ? 'done' : 'error';
        entry.code = code ?? 1;
        entry.child = null;
        onUpdate?.(processId, entry);
    });

    child.on('error', (error) => {
        entry.output += `\nProcess error: ${error.message}`;
        entry.status = 'error';
        entry.code = 1;
        entry.child = null;
        onUpdate?.(processId, entry);
    });

    return processId;
}

export async function runCommandStreaming(commandDef, selections, onData) {
    if (commandDef?.hints?.interactive) {
        return {
            code: 1,
            stdout: '',
            stderr: '',
            error: new Error(`"${commandDef.group} ${commandDef.command}" is interactive and is not supported in gnar ui yet.`)
        };
    }

    const argv = buildArgv(commandDef, selections);

    return new Promise((resolve) => {
        const child = spawn(process.execPath, [cliEntrypoint, ...argv], {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: process.env
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
            onData(stdout + (stderr ? '\n' + stderr : ''));
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
            onData(stdout + (stderr ? '\n' + stderr : ''));
        });

        child.on('close', (code) => {
            resolve({ code: code ?? 1, stdout, stderr });
        });

        child.on('error', (error) => {
            resolve({ code: 1, error, stdout, stderr });
        });
    });
}
