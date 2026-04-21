import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliEntrypoint = path.resolve(__dirname, '..', 'cli.js');

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

export async function runCommandStreaming(commandDef, selections, onData) {
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
