import React, { useMemo, useState } from 'react';
import { Box, Text, useApp, useInput, render } from 'ink';
import TextInput from 'ink-text-input';
import { profiles } from '../profiles/profiles.client.js';
import { getGroups, searchCommands } from './command-catalog.js';
import { buildPreview, runCommandStreaming } from './runner.js';

const h = React.createElement;

const BANNER = [
    '   ____ _   _    _    ____    _____ _   _  ____ ___ _   _ _____',
    '  / ___| \\ | |  / \\  |  _ \\  | ____| \\ | |/ ___|_ _| \\ | | ____|',
    ' | |  _|  \\| | / _ \\ | |_) | |  _| |  \\| | |  _ | ||  \\| |  _|',
    ' | |_| | |\\  |/ ___ \\|  _ <  | |___| |\\  | |_| || || |\\  | |___',
    '  \\____|_| \\_/_/   \\_\\_| \\_\\ |_____|_| \\_|\\____|___|_| \\_|_____|'
];

function getActiveProfileInfo() {
    try {
        const { name, profile } = profiles.getActiveProfile();
        return { name, projectDir: profile.PROJECT_DIR || null };
    } catch {
        return null;
    }
}

const BROWSE_KEY_HINTS = [
    { key: '↑↓ j/k', desc: 'move' },
    { key: 'type', desc: 'filter' },
    { key: 'enter', desc: 'expand' },
    { key: 'q/esc', desc: 'quit' },
];

const VARIANTS_KEY_HINTS = [
    { key: '↑↓ j/k', desc: 'move' },
    { key: 'enter', desc: 'run' },
    { key: 'esc', desc: 'back' },
];

function normalizeQuery(input) {
    if (!input.startsWith('/')) return '/' + input;
    return input;
}

function getCommandIssues(commandDef) {
    const missingArgs = commandDef.args.filter((arg) => arg.required);
    const missingOptions = commandDef.options.filter((opt) => opt.required);
    return {
        runnable: missingArgs.length === 0 && missingOptions.length === 0,
        missingArgs,
        missingOptions
    };
}

function getVariants(commandDef) {
    const base = { args: {}, options: {} };
    const items = [{ label: buildPreview(commandDef, base), selections: base, hint: 'Run without flags' }];
    for (const opt of commandDef.options) {
        if (opt.type !== 'boolean') continue;
        const sel = { args: {}, options: { [opt.key]: true } };
        items.push({ label: buildPreview(commandDef, sel), selections: sel, hint: opt.description });
    }
    return items;
}

function trimOutput(text, maxLines = 10) {
    const lines = text.split('\n');
    return lines.slice(-maxLines).join('\n');
}

const VISIBLE_COUNT = 18;

function App() {
    const { exit } = useApp();
    const [query, setQuery] = useState('/');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [runState, setRunState] = useState({ status: 'idle', output: '' });
    const [mode, setMode] = useState('browse'); // 'browse' | 'variants'
    const [variantIndex, setVariantIndex] = useState(0);

    const term = useMemo(() => query.slice(1).trim(), [query]);
    const commands = useMemo(() => searchCommands(term), [term]);
    const selected = commands[selectedIndex] || null;
    const issues = selected ? getCommandIssues(selected) : null;
    const groups = useMemo(() => getGroups(), []);
    const profileInfo = useMemo(() => getActiveProfileInfo(), []);

    const variants = useMemo(() => selected ? getVariants(selected) : [], [selected]);

    const preview = useMemo(
        () => selected ? buildPreview(selected, { args: {}, options: {} }) : 'No command selected',
        [selected]
    );

    const scrollOffset = useMemo(() => {
        if (commands.length <= VISIBLE_COUNT) return 0;
        return Math.min(
            Math.max(0, selectedIndex - Math.floor(VISIBLE_COUNT / 2)),
            commands.length - VISIBLE_COUNT
        );
    }, [selectedIndex, commands.length]);

    const executeVariant = (commandDef, selections) => {
        const cmdIssues = getCommandIssues(commandDef);
        if (!cmdIssues.runnable) {
            const missing = [
                ...cmdIssues.missingArgs.map((arg) => `<${arg.key}>`),
                ...cmdIssues.missingOptions.map((opt) => opt.flag)
            ];
            setRunState({ status: 'error', output: `Required: ${missing.join(', ')}` });
            return;
        }

        setRunState({ status: 'running', output: '' });
        runCommandStreaming(commandDef, selections, (output) => {
            setRunState((prev) => ({ ...prev, output: trimOutput(output) }));
        }).then((result) => {
            const outputParts = [result.stdout?.trim(), result.stderr?.trim()].filter(Boolean);
            const output = trimOutput(outputParts.join('\n'));
            setRunState({
                status: result.code === 0 ? 'success' : 'error',
                output: output || (result.code === 0 ? 'Done.' : `Exit ${result.code}.`)
            });
        }).catch((err) => {
            setRunState({ status: 'error', output: err.message });
        });
    };

    useInput((input, key) => {
        if (runState.status === 'running') return;

        if (mode === 'variants') {
            if (key.escape) { setMode('browse'); setVariantIndex(0); return; }
            if (key.upArrow || input === 'k') {
                setVariantIndex((prev) => (prev - 1 + variants.length) % variants.length);
                return;
            }
            if (key.downArrow || input === 'j') {
                setVariantIndex((prev) => (prev + 1) % variants.length);
                return;
            }
            if (key.return && variants[variantIndex]) {
                executeVariant(selected, variants[variantIndex].selections);
            }
            return;
        }

        // browse mode
        if (key.escape || input === 'q') { exit(); return; }
        if (key.upArrow || input === 'k') {
            if (commands.length > 0) setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
            return;
        }
        if (key.downArrow || input === 'j') {
            if (commands.length > 0) setSelectedIndex((prev) => (prev + 1) % commands.length);
            return;
        }
        if (key.return && selected) {
            if (issues && !issues.runnable) {
                const missing = [
                    ...issues.missingArgs.map((arg) => `<${arg.key}>`),
                    ...issues.missingOptions.map((opt) => opt.flag)
                ];
                setRunState({ status: 'error', output: `Required: ${missing.join(', ')}` });
                return;
            }
            setMode('variants');
            setVariantIndex(0);
        }
    });

    const visibleCommands = commands.slice(scrollOffset, scrollOffset + VISIBLE_COUNT);
    const keyHints = mode === 'variants' ? VARIANTS_KEY_HINTS : BROWSE_KEY_HINTS;
    const currentVariant = variants[variantIndex];

    const outputColor = runState.status === 'running' ? 'yellow'
        : runState.status === 'success' ? 'greenBright'
        : runState.status === 'error' ? 'red'
        : 'gray';

    return h(
        Box,
        { flexDirection: 'column' },
        h(Box, { flexDirection: 'column' }, ...BANNER.map((line, i) => h(Text, { key: `b-${i}`, color: 'cyanBright' }, line))),
        h(Text, { color: 'gray' }, '--------------------------------------------------------------------------------'),
        h(Text, { color: 'white', bold: true }, 'Gnar UI - Full Screen Command Palette'),
        h(Box, {},
            h(Text, { color: 'gray' }, 'Active profile: '),
            profileInfo
                ? h(Text, { color: 'greenBright', bold: true }, profileInfo.name)
                : h(Text, { color: 'red' }, 'none'),
            profileInfo?.projectDir
                ? h(Text, { color: 'gray' }, ` (${profileInfo.projectDir})`)
                : null
        ),
        h(Box, {},
            h(Text, { color: 'gray' }, 'Keys  '),
            ...keyHints.flatMap(({ key, desc }, i) => [
                h(Text, { key: `k-${key}`, color: 'yellowBright', bold: true }, key),
                h(Text, { key: `d-${key}`, color: 'gray' }, ` ${desc}`),
                i < keyHints.length - 1 ? h(Text, { key: `s-${i}`, color: 'gray' }, '  ·  ') : null
            ])
        ),
        h(Text, { color: 'gray' }, '--------------------------------------------------------------------------------'),

        // Search bar (browse mode only)
        mode === 'browse'
            ? h(Box, { marginTop: 1 },
                h(Text, { color: 'yellow' }, 'Palette: '),
                h(TextInput, {
                    value: query,
                    onChange: (value) => {
                        setQuery(normalizeQuery(value));
                        setSelectedIndex(0);
                    },
                    placeholder: '/'
                })
            )
            : h(Box, { marginTop: 1 },
                h(Text, { color: 'yellow' }, 'Options: '),
                h(Text, { color: 'cyanBright' }, selected ? `${selected.group} ${selected.command}` : '')
            ),

        h(Box, { marginTop: 1, height: 22 },

            // Left panel — command list or variants list
            mode === 'browse'
                ? h(Box, { width: '42%', flexDirection: 'column', borderStyle: 'round', borderColor: 'gray', paddingX: 1 },
                    h(Text, { color: 'magentaBright' }, `Commands (${commands.length})`),
                    ...visibleCommands.map((cmd, index) => {
                        const isSelected = index + scrollOffset === selectedIndex;
                        return h(Text, { key: cmd.id, color: isSelected ? 'black' : 'white', backgroundColor: isSelected ? 'cyan' : undefined },
                            `${isSelected ? '>' : ' '} ${cmd.group}.${cmd.command} - ${cmd.description}`
                        );
                    }),
                    commands.length === 0 ? h(Text, { color: 'red' }, 'No commands found') : null
                )
                : h(Box, { width: '42%', flexDirection: 'column', borderStyle: 'round', borderColor: 'cyan', paddingX: 1 },
                    h(Text, { color: 'magentaBright' }, `Variants (${variants.length})`),
                    ...variants.map((v, index) => {
                        const isSelected = index === variantIndex;
                        return h(Text, { key: `v-${index}`, color: isSelected ? 'black' : 'white', backgroundColor: isSelected ? 'cyan' : undefined },
                            `${isSelected ? '>' : ' '} ${v.label}`
                        );
                    })
                ),

            // Right panel — info + run output
            h(Box, { width: '58%', flexDirection: 'column', borderStyle: 'round', borderColor: 'gray', paddingX: 1 },

                // Info section
                ...(mode === 'browse'
                    ? [
                        h(Text, { key: 'ph', color: 'greenBright' }, 'Preview'),
                        h(Text, { key: 'pv', wrap: 'wrap' }, preview),
                        h(Text, { key: 'e1' }, ''),
                        h(Text, { key: 'gh', color: 'greenBright' }, 'Groups'),
                        h(Text, { key: 'gv', color: 'gray' }, groups.join(', ')),
                        selected
                            ? h(Text, { key: 'safe', color: selected.hints?.destructive ? 'red' : 'gray' },
                                selected.hints?.destructive ? 'Warning: destructive command' : 'Safe command')
                            : null,
                        selected && issues && !issues.runnable
                            ? h(Text, { key: 'req', color: 'yellow' }, `Requires: ${[
                                ...issues.missingArgs.map((a) => `<${a.key}>`),
                                ...issues.missingOptions.map((o) => o.flag)
                            ].join(', ')}`)
                            : null,
                    ]
                    : [
                        h(Text, { key: 'vh', color: 'greenBright' }, 'Selected variant'),
                        currentVariant
                            ? h(Text, { key: 'vl', color: 'white', bold: true }, currentVariant.label)
                            : null,
                        currentVariant?.hint
                            ? h(Text, { key: 'vi', color: 'gray' }, currentVariant.hint)
                            : null,
                        selected?.hints?.destructive
                            ? h(Text, { key: 'vd', color: 'red' }, 'Warning: destructive command')
                            : null,
                    ]
                ),

                h(Text, { key: 'e2' }, ''),
                h(Text, { key: 'roh', color: 'greenBright' },
                    runState.status === 'running' ? 'Run Output  (running...)' : 'Run Output'
                ),
                h(Text, { key: 'rov', color: outputColor },
                    runState.output || 'No output yet.'
                )
            )
        )
    );
}

export async function startUiSession() {
    const { waitUntilExit } = render(h(App));
    await waitUntilExit();
}
