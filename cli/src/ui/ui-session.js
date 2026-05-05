import { createRequire } from 'module';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useApp, useInput, render } from 'ink';
import TextInput from 'ink-text-input';
import { profiles } from '../profiles/profiles.client.js';
import { getGroups, searchCommands } from './command-catalog.js';
import { buildPreview, dismissProcess, getProcessRegistry, killProcess, runCommandStreaming, spawnPersistent } from './runner.js';

const require = createRequire(import.meta.url);
const { version: GNAR_VERSION } = require('../../package.json');

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
    { key: 'up/down', desc: 'move' },
    { key: 'type', desc: 'filter' },
    { key: 'enter', desc: 'expand' },
    { key: 'p', desc: 'processes' },
    { key: 'esc', desc: 'quit' }
];

const VARIANTS_KEY_HINTS = [
    { key: 'up/down j/k', desc: 'move' },
    { key: 'enter', desc: 'run' },
    { key: 'esc', desc: 'back' }
];

const FORM_TEXT_KEY_HINTS = [
    { key: 'type', desc: 'value' },
    { key: 'enter', desc: 'next/save' },
    { key: 'esc', desc: 'cancel' }
];

const FORM_SELECT_KEY_HINTS = [
    { key: 'up/down', desc: 'move' },
    { key: 'enter', desc: 'select' },
    { key: 'esc', desc: 'cancel' }
];

const OUTPUT_KEY_HINTS = [
    { key: 'up/down j/k', desc: 'scroll' },
    { key: 'g/G', desc: 'top/bottom' },
    { key: 'e', desc: 'errors only' },
    { key: 'esc', desc: 'back' }
];

const PROCESSES_KEY_HINTS = [
    { key: 'up/down j/k', desc: 'move' },
    { key: 'enter', desc: 'view output' },
    { key: 'x', desc: 'kill' },
    { key: 'd', desc: 'dismiss' },
    { key: 'esc', desc: 'back' }
];

function formatElapsed(startedAt) {
    const s = Math.floor((Date.now() - startedAt) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
}

function normalizeQuery(input) {
    if (!input.startsWith('/')) {
        return '/' + input;
    }

    return input;
}

function hasValue(value) {
    return value !== undefined && value !== null && String(value).trim().length > 0;
}

function createDefaultSelections(commandDef) {
    const selections = { args: {}, options: {} };

    for (const option of commandDef.options) {
        if (option.type === 'boolean') {
            selections.options[option.key] = false;
            continue;
        }

        if (option.defaultValue !== undefined) {
            selections.options[option.key] = option.defaultValue;
        }
    }

    return selections;
}

function getCommandIssues(commandDef, selections = { args: {}, options: {} }) {
    const missingArgs = commandDef.args.filter((arg) => arg.required && !hasValue(selections.args[arg.key]));
    const missingOptions = commandDef.options.filter((opt) => opt.required && !hasValue(selections.options[opt.key]));

    return {
        runnable: missingArgs.length === 0 && missingOptions.length === 0,
        missingArgs,
        missingOptions
    };
}

function getRequiredFields(commandDef, selections) {
    const requiredArgs = commandDef.args
        .filter((arg) => arg.required)
        .map((arg) => ({
            id: `arg:${arg.key}`,
            type: 'arg',
            fieldType: arg.type === 'select' ? 'select' : 'text',
            choicesFn: arg.choicesFn || null,
            key: arg.key,
            label: `<${arg.key}>`,
            description: arg.description || arg.key,
            currentValue: selections.args[arg.key] || ''
        }));

    const requiredOptions = commandDef.options
        .filter((opt) => opt.required)
        .map((opt) => ({
            id: `opt:${opt.key}`,
            type: 'option',
            fieldType: opt.type === 'select' ? 'select' : 'text',
            choicesFn: opt.choicesFn || null,
            key: opt.key,
            label: opt.flag,
            description: opt.description || opt.flag,
            currentValue: selections.options[opt.key] || ''
        }));

    return [...requiredArgs, ...requiredOptions];
}

function getVariants(commandDef, baseSelections) {
    const base = {
        args: { ...baseSelections.args },
        options: { ...baseSelections.options }
    };

    const items = [
        {
            label: buildPreview(commandDef, base),
            selections: base,
            hint: 'Run with current values'
        }
    ];

    for (const opt of commandDef.options) {
        if (opt.type === 'boolean') {
            if (base.options[opt.key]) {
                continue;
            }

            const sel = {
                args: { ...base.args },
                options: { ...base.options, [opt.key]: true }
            };

            items.push({
                label: buildPreview(commandDef, sel),
                selections: sel,
                hint: opt.description
            });

            continue;
        }

        if (!opt.choicesFn || hasValue(base.options[opt.key])) {
            continue;
        }

        const choices = opt.choicesFn();

        for (const choice of choices) {
            const sel = {
                args: { ...base.args },
                options: { ...base.options, [opt.key]: choice.value }
            };

            items.push({
                label: buildPreview(commandDef, sel),
                selections: sel,
                hint: `${opt.description}: ${choice.label}`
            });
        }
    }

    return items;
}

function trimOutput(text, maxLines = 7) {
    const lines = text.split('\n');
    return lines.slice(-maxLines).join('\n');
}

const VISIBLE_COUNT = 13;
const OUTPUT_VISIBLE_LINES = 19;
const PROCESS_TAIL_LINES = 7;
const ERROR_PATTERN = /error|err\b|failed|failure|warn|warning|exception|fatal/i;

function getWindowOffset(selectedIndex, total, visibleCount = VISIBLE_COUNT) {
    if (total <= visibleCount) {
        return 0;
    }

    return Math.min(
        Math.max(0, selectedIndex - Math.floor(visibleCount / 2)),
        total - visibleCount
    );
}

function App() {
    const { exit } = useApp();
    const [query, setQuery] = useState('/');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [runState, setRunState] = useState({ status: 'idle', output: '' });
    const [fullOutput, setFullOutput] = useState('');
    const [outputScrollOffset, setOutputScrollOffset] = useState(0);
    const [lastRunPreview, setLastRunPreview] = useState('');
    const [errorsOnly, setErrorsOnly] = useState(false);
    const runId = useRef(0);
    const [mode, setMode] = useState('browse'); // browse | form | variants | output | processes
    const [variantIndex, setVariantIndex] = useState(0);
    const [requiredFieldIndex, setRequiredFieldIndex] = useState(0);
    const [formInput, setFormInput] = useState('');
    const [selectChoices, setSelectChoices] = useState([]);
    const [selectIndex, setSelectIndex] = useState(0);
    const [activeSelections, setActiveSelections] = useState({ args: {}, options: {} });
    const [profileInfo, setProfileInfo] = useState(() => getActiveProfileInfo());

    // persistent processes
    const [processesVersion, setProcessesVersion] = useState(0);
    const [selectedProcessIndex, setSelectedProcessIndex] = useState(0);
    const [viewingProcessId, setViewingProcessId] = useState(null);
    const watchingProcessIdRef = useRef(null);
    const pendingOpenProcessIdRef = useRef(null);
    const autoScrollRef = useRef(true);

    const handleProcessUpdate = useCallback((processId, entry) => {
        setProcessesVersion((v) => v + 1);
        if (watchingProcessIdRef.current === processId) {
            setFullOutput(entry.output);
        }
    }, []);

    useEffect(() => {
        if (!autoScrollRef.current) return;
        const lines = fullOutput ? fullOutput.split('\n') : [];
        setOutputScrollOffset(Math.max(0, lines.length - OUTPUT_VISIBLE_LINES));
    }, [fullOutput]);

    useEffect(() => {
        const id = pendingOpenProcessIdRef.current;
        if (id !== null) {
            pendingOpenProcessIdRef.current = null;
            openProcessOutput(id);
        }
    });

    const term = useMemo(() => query.slice(1).trim(), [query]);
    const commands = useMemo(() => searchCommands(term), [term]);
    const selected = commands[selectedIndex] || null;
    const issues = selected ? getCommandIssues(selected, activeSelections) : null;
    const groups = useMemo(() => getGroups(), []);
    const refreshProfileInfo = useCallback(() => {
        setProfileInfo(getActiveProfileInfo());
    }, []);

    const processes = useMemo(() => {
        return [...getProcessRegistry().values()].reverse();
    }, [processesVersion]);

    const runningCount = useMemo(() => {
        return processes.filter((e) => e.status === 'running').length;
    }, [processes]);

    const selectedProcess = processes[selectedProcessIndex] || null;

    const requiredFields = useMemo(() => {
        if (!selected) {
            return [];
        }

        return getRequiredFields(selected, activeSelections);
    }, [selected, activeSelections]);

    const variants = useMemo(() => {
        if (!selected) {
            return [];
        }

        return getVariants(selected, activeSelections);
    }, [selected, activeSelections]);

    const preview = useMemo(() => {
        if (!selected) {
            return 'No command selected';
        }

        return buildPreview(selected, activeSelections);
    }, [selected, activeSelections]);

    const scrollOffset = useMemo(() => {
        return getWindowOffset(selectedIndex, commands.length);
    }, [selectedIndex, commands.length]);

    const selectScrollOffset = useMemo(() => {
        return getWindowOffset(selectIndex, selectChoices.length);
    }, [selectIndex, selectChoices.length]);

    const variantScrollOffset = useMemo(() => {
        return getWindowOffset(variantIndex, variants.length);
    }, [variantIndex, variants.length]);

    const openProcessOutput = (processId) => {
        const entry = getProcessRegistry().get(processId);
        if (!entry) return;
        autoScrollRef.current = true;
        watchingProcessIdRef.current = processId;
        setViewingProcessId(processId);
        setFullOutput(entry.output);
        const lines = entry.output.split('\n');
        setOutputScrollOffset(Math.max(0, lines.length - OUTPUT_VISIBLE_LINES));
        setErrorsOnly(false);
        setMode('output');
    };

    const executeVariant = (commandDef, selections) => {
        const cmdIssues = getCommandIssues(commandDef, selections);
        if (!cmdIssues.runnable) {
            const missing = [
                ...cmdIssues.missingArgs.map((arg) => `<${arg.key}>`),
                ...cmdIssues.missingOptions.map((opt) => opt.flag)
            ];
            setRunState({ status: 'error', output: `Required: ${missing.join(', ')}` });
            return;
        }

        if (commandDef.hints?.persistent) {
            const processId = spawnPersistent(commandDef, selections, handleProcessUpdate);
            setProcessesVersion((v) => v + 1);
            setSelectedProcessIndex(0);
            setMode('processes');
            pendingOpenProcessIdRef.current = processId;
            return;
        }

        const id = ++runId.current;
        autoScrollRef.current = true;
        setLastRunPreview(buildPreview(commandDef, selections));
        setFullOutput('');
        setOutputScrollOffset(0);
        setErrorsOnly(false);
        setRunState({ status: 'running', output: '' });
        runCommandStreaming(commandDef, selections, (output) => {
            if (runId.current !== id) return;
            setFullOutput(output);
            setRunState((prev) => ({ ...prev, output: trimOutput(output) }));
        }).then((result) => {
            if (runId.current !== id) return;
            refreshProfileInfo();
            const outputParts = [result.stdout?.trim(), result.stderr?.trim()].filter(Boolean);
            const raw = outputParts.join('\n');
            const fallback = result.code === 0 ? 'Done.' : `Exit ${result.code}.`;
            setFullOutput(raw || fallback);
            setRunState({
                status: result.code === 0 ? 'success' : 'error',
                output: trimOutput(raw) || fallback
            });
        }).catch((err) => {
            if (runId.current !== id) return;
            setFullOutput(err.message);
            setRunState({ status: 'error', output: err.message });
        });
    };

    useInput((input, key) => {
        if (mode === 'output') {
            if (key.escape) {
                if (viewingProcessId !== null) {
                    watchingProcessIdRef.current = null;
                    setViewingProcessId(null);
                    setMode('processes');
                } else {
                    setMode('browse');
                }
                return;
            }
            const maxOffset = Math.max(0, outputLines.length - OUTPUT_VISIBLE_LINES);
            const step = key.shift ? 1 : 5;
            if (key.upArrow || input === 'k') {
                autoScrollRef.current = false;
                setOutputScrollOffset((prev) => Math.max(0, prev - step));
                return;
            }
            if (key.downArrow || input === 'j') {
                setOutputScrollOffset((prev) => {
                    const next = Math.min(maxOffset, prev + step);
                    if (next >= maxOffset) autoScrollRef.current = true;
                    return next;
                });
                return;
            }
            if (input === 'g') {
                autoScrollRef.current = false;
                setOutputScrollOffset(0);
                return;
            }
            if (input === 'G') {
                autoScrollRef.current = true;
                setOutputScrollOffset(maxOffset);
                return;
            }
            if (input === 'e') {
                setErrorsOnly((prev) => !prev);
                setOutputScrollOffset(0);
                return;
            }
            return;
        }

        if (mode === 'processes') {
            if (key.escape) {
                setMode('browse');
                return;
            }
            if (key.upArrow || input === 'k') {
                setSelectedProcessIndex((prev) => Math.max(0, prev - 1));
                return;
            }
            if (key.downArrow || input === 'j') {
                setSelectedProcessIndex((prev) => Math.min(processes.length - 1, prev + 1));
                return;
            }
            if (key.return && selectedProcess) {
                openProcessOutput(selectedProcess.processId);
                return;
            }
            if (input === 'x' && selectedProcess) {
                killProcess(selectedProcess.processId);
                setProcessesVersion((v) => v + 1);
                return;
            }
            if (input === 'd' && selectedProcess) {
                const dismissed = dismissProcess(selectedProcess.processId);
                if (dismissed) {
                    setProcessesVersion((v) => v + 1);
                    setSelectedProcessIndex((prev) => Math.max(0, prev - 1));
                }
                return;
            }
            return;
        }

        if (input === 'o' && fullOutput && mode !== 'form') {
            const lines = fullOutput.split('\n');
            setOutputScrollOffset(Math.max(0, lines.length - OUTPUT_VISIBLE_LINES));
            setMode('output');
            return;
        }

        if (input === 'p' && mode === 'browse') {
            setSelectedProcessIndex(0);
            setMode('processes');
            return;
        }

        if (mode === 'form') {
            if (key.escape) {
                setMode('browse');
                setRequiredFieldIndex(0);
                setSelectChoices([]);
                setSelectIndex(0);
                return;
            }

            const field = requiredFields[requiredFieldIndex];

            if (field?.fieldType === 'select') {
                if (key.upArrow || input === 'k') {
                    setSelectIndex((prev) => Math.max(0, prev - 1));
                    return;
                }
                if (key.downArrow || input === 'j') {
                    setSelectIndex((prev) => Math.min(selectChoices.length - 1, prev + 1));
                    return;
                }
                if (key.return) {
                    const chosen = selectChoices[selectIndex];
                    if (!chosen) return;

                    const nextSelections = {
                        args: { ...activeSelections.args },
                        options: { ...activeSelections.options }
                    };

                    if (field.type === 'arg') {
                        nextSelections.args[field.key] = chosen.value;
                    } else {
                        nextSelections.options[field.key] = chosen.value;
                    }

                    setActiveSelections(nextSelections);

                    const atLast = requiredFieldIndex >= requiredFields.length - 1;
                    if (atLast) {
                        setMode('variants');
                        setVariantIndex(0);
                        setRequiredFieldIndex(0);
                    } else {
                        const nextIndex = requiredFieldIndex + 1;
                        setRequiredFieldIndex(nextIndex);
                        const nextField = requiredFields[nextIndex];
                        if (nextField?.fieldType === 'select') {
                            const choices = nextField.choicesFn ? nextField.choicesFn() : [];
                            setSelectChoices(choices);
                            setSelectIndex(0);
                        } else {
                            setFormInput(nextField?.currentValue || '');
                        }
                    }
                    return;
                }
                return;
            }

            if (key.return) {
                if (!field) {
                    setMode('variants');
                    setVariantIndex(0);
                    return;
                }

                const nextSelections = {
                    args: { ...activeSelections.args },
                    options: { ...activeSelections.options }
                };

                if (field.type === 'arg') {
                    nextSelections.args[field.key] = formInput;
                } else {
                    nextSelections.options[field.key] = formInput;
                }

                setActiveSelections(nextSelections);

                const atLast = requiredFieldIndex >= requiredFields.length - 1;
                if (atLast) {
                    setMode('variants');
                    setVariantIndex(0);
                    setRequiredFieldIndex(0);
                } else {
                    const nextIndex = requiredFieldIndex + 1;
                    setRequiredFieldIndex(nextIndex);
                    const nextField = requiredFields[nextIndex];
                    if (nextField?.fieldType === 'select') {
                        const choices = nextField.choicesFn ? nextField.choicesFn() : [];
                        setSelectChoices(choices);
                        setSelectIndex(0);
                    } else {
                        setFormInput(nextField?.currentValue || '');
                    }
                }
            }

            return;
        }

        if (mode === 'variants') {
            if (key.escape) {
                setMode('browse');
                setVariantIndex(0);
                return;
            }
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

        if (key.escape) {
            exit();
            return;
        }
        if (key.upArrow) {
            if (commands.length > 0) {
                setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
                setActiveSelections({ args: {}, options: {} });
            }
            return;
        }
        if (key.downArrow) {
            if (commands.length > 0) {
                setSelectedIndex((prev) => (prev + 1) % commands.length);
                setActiveSelections({ args: {}, options: {} });
            }
            return;
        }

        if (key.return && selected) {
            const defaults = createDefaultSelections(selected);
            setActiveSelections(defaults);

            const required = getRequiredFields(selected, defaults);
            if (required.length > 0) {
                setMode('form');
                setRequiredFieldIndex(0);
                const first = required[0];
                if (first.fieldType === 'select') {
                    const choices = first.choicesFn ? first.choicesFn() : [];
                    setSelectChoices(choices);
                    setSelectIndex(0);
                } else {
                    setFormInput(first.currentValue || '');
                }
                return;
            }

            setMode('variants');
            setVariantIndex(0);
        }
    });

    const visibleCommands = commands.slice(scrollOffset, scrollOffset + VISIBLE_COUNT);
    const visibleSelectChoices = selectChoices.slice(selectScrollOffset, selectScrollOffset + VISIBLE_COUNT);
    const visibleVariants = variants.slice(variantScrollOffset, variantScrollOffset + VISIBLE_COUNT);
    const outputLines = useMemo(() => {
        const lines = fullOutput ? fullOutput.split('\n') : [];
        return errorsOnly ? lines.filter((l) => ERROR_PATTERN.test(l)) : lines;
    }, [fullOutput, errorsOnly]);
    const hasOutput = outputLines.length > 0 || (viewingProcessId === null && runState.output);
    const currentVariant = variants[variantIndex];
    const currentRequiredField = requiredFields[requiredFieldIndex];
    const keyHints = mode === 'output' ? OUTPUT_KEY_HINTS
        : mode === 'processes' ? PROCESSES_KEY_HINTS
        : mode === 'variants' ? (hasOutput ? [...VARIANTS_KEY_HINTS, { key: 'o', desc: 'logs' }] : VARIANTS_KEY_HINTS)
        : mode === 'form' ? (currentRequiredField?.fieldType === 'select' ? FORM_SELECT_KEY_HINTS : FORM_TEXT_KEY_HINTS)
        : (hasOutput ? [...BROWSE_KEY_HINTS, { key: 'o', desc: 'logs' }] : BROWSE_KEY_HINTS);

    const outputColor = runState.status === 'running' ? 'yellow'
        : runState.status === 'success' ? 'greenBright'
            : runState.status === 'error' ? 'red'
                : 'gray';

    const viewingProcess = viewingProcessId !== null ? getProcessRegistry().get(viewingProcessId) : null;
    const viewingOutputColor = !viewingProcess ? 'gray'
        : viewingProcess.status === 'running' ? 'yellow'
        : viewingProcess.status === 'done' ? 'greenBright'
        : 'red';

    return h(
        Box,
        { flexDirection: 'column' },
        h(Box, { flexDirection: 'column' }, ...BANNER.map((line, i) => h(Text, { key: `b-${i}`, color: 'cyanBright' }, line))),
        h(Text, { color: 'gray' }, '--------------------------------------------------------------------------------'),
        h(Box, {},
            h(Text, { color: 'white', bold: true }, 'Gnar UI'),
            h(Text, { color: 'gray' }, `  v${GNAR_VERSION}`),
            runningCount > 0
                ? h(Text, { color: 'yellow' }, `  ● ${runningCount} running`)
                : null
        ),
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

        mode === 'output'
            ? h(Box, { marginTop: 1 },
                h(Text, { color: 'yellow' }, 'Output: '),
                h(Text, { color: viewingProcessId !== null ? viewingOutputColor : outputColor },
                    viewingProcessId !== null
                        ? (viewingProcess?.preview || `process ${viewingProcessId}`)
                        : lastRunPreview
                )
            )
            : mode === 'processes'
            ? h(Box, { marginTop: 1 },
                h(Text, { color: 'yellow' }, 'Processes: '),
                h(Text, { color: 'gray' }, `${processes.length} total  ${runningCount} running`)
            )
            : mode === 'browse'
            ? h(Box, { marginTop: 1 },
                h(Text, { color: 'yellow' }, 'Palette: '),
                h(TextInput, {
                    value: query,
                    onChange: (value) => {
                        setQuery(normalizeQuery(value));
                        setSelectedIndex(0);
                        setActiveSelections({ args: {}, options: {} });
                    },
                    placeholder: '/'
                })
            )
            : mode === 'form'
                ? h(Box, { marginTop: 1 },
                    h(Text, { color: 'yellow' }, `Required input ${requiredFieldIndex + 1}/${requiredFields.length}: `),
                    h(Text, { color: 'cyanBright' }, currentRequiredField ? `${currentRequiredField.label} ` : ''),
                    currentRequiredField?.fieldType === 'select'
                        ? h(Text, { color: 'gray' }, selectChoices[selectIndex]?.label || '')
                        : h(TextInput, {
                            value: formInput,
                            onChange: setFormInput,
                            placeholder: currentRequiredField?.description || ''
                        })
                )
                : h(Box, { marginTop: 1 },
                    h(Text, { color: 'yellow' }, 'Options: '),
                    h(Text, { color: 'cyanBright' }, selected ? `${selected.group} ${selected.command}` : '')
                ),

        h(Box, { marginTop: 1, height: 22 },
            mode === 'output'
                ? h(Box, { width: '100%', flexDirection: 'column', borderStyle: 'round', borderColor: viewingProcessId !== null ? viewingOutputColor : outputColor, paddingX: 1 },
                    ...outputLines.slice(outputScrollOffset, outputScrollOffset + OUTPUT_VISIBLE_LINES).map((line, i) =>
                        h(Text, { key: `ol-${i}`, color: 'white' }, line || ' ')
                    ),
                    h(Box, { key: 'osi' },
                        h(Text, { color: 'gray' },
                            outputLines.length > OUTPUT_VISIBLE_LINES
                                ? `lines ${outputScrollOffset + 1}-${Math.min(outputScrollOffset + OUTPUT_VISIBLE_LINES, outputLines.length)}/${outputLines.length}`
                                : `${outputLines.length} line${outputLines.length !== 1 ? 's' : ''}`
                        ),
                        errorsOnly ? h(Text, { color: 'red' }, '  errors only') : null,
                        errorsOnly && outputLines.length === 0 ? h(Text, { color: 'gray' }, ' (none found)') : null,
                        viewingProcess?.status === 'running' && autoScrollRef.current ? h(Text, { color: 'yellow' }, '  tailing') : null,
                        viewingProcess?.status === 'running' && !autoScrollRef.current ? h(Text, { color: 'gray' }, '  paused  ↓j/G to resume') : null
                    )
                )
            : mode === 'processes'
                ? h(Box, { width: '100%', flexDirection: 'row' },
                    h(Box, { width: '42%', flexDirection: 'column', borderStyle: 'round', borderColor: 'gray', paddingX: 1 },
                        h(Text, { color: 'magentaBright' }, `Processes (${processes.length})`),
                        processes.length === 0
                            ? h(Text, { color: 'gray' }, 'No processes yet.')
                            : processes.map((entry, index) => {
                                const isSelected = index === selectedProcessIndex;
                                const statusColor = entry.status === 'running' ? 'yellow'
                                    : entry.status === 'done' ? 'greenBright'
                                    : 'red';
                                const elapsed = formatElapsed(entry.startedAt);
                                return h(Box, { key: `p-${entry.processId}`, flexDirection: 'column' },
                                    h(Text, {
                                        color: isSelected ? 'black' : 'white',
                                        backgroundColor: isSelected ? 'cyan' : undefined,
                                        wrap: 'truncate'
                                    }, `${isSelected ? '>' : ' '} ${entry.preview}`),
                                    h(Text, {
                                        color: isSelected ? 'black' : statusColor,
                                        backgroundColor: isSelected ? 'cyan' : undefined
                                    }, `    ${entry.status}  ${elapsed}`)
                                );
                            })
                    ),
                    h(Box, { width: '58%', flexDirection: 'column', borderStyle: 'round', borderColor: selectedProcess ? (selectedProcess.status === 'running' ? 'yellow' : selectedProcess.status === 'done' ? 'greenBright' : 'red') : 'gray', paddingX: 1 },
                        h(Text, { color: 'greenBright' }, selectedProcess ? 'Output tail' : 'No process selected'),
                        ...(selectedProcess
                            ? selectedProcess.output.split('\n').slice(-PROCESS_TAIL_LINES).map((line, i) =>
                                h(Text, { key: `pt-${i}`, color: 'white', wrap: 'truncate' }, line || ' ')
                            )
                            : [h(Text, { key: 'np', color: 'gray' }, 'Select a process and press enter to view output.')]
                        ),
                        selectedProcess
                            ? h(Text, { color: 'gray' }, `press enter to view full output`)
                            : null
                    )
                )
            : mode === 'browse'
                ? h(Box, { width: '42%', flexDirection: 'column', borderStyle: 'round', borderColor: 'gray', paddingX: 1 },
                    h(Text, { color: 'magentaBright' }, `Commands (${commands.length})`),
                    ...(() => {
                        const items = [];
                        let lastGroup = null;
                        visibleCommands.forEach((cmd, index) => {
                            if (cmd.group !== lastGroup) {
                                items.push(h(Text, { key: `grp-${cmd.group}`, color: 'cyanBright', bold: true }, cmd.group));
                                lastGroup = cmd.group;
                            }
                            const isSelected = index + scrollOffset === selectedIndex;
                            items.push(h(Text, {
                                key: cmd.id,
                                color: isSelected ? 'black' : 'white',
                                backgroundColor: isSelected ? 'cyan' : undefined
                            }, `  ${isSelected ? '>' : ' '} ${cmd.command}${cmd.description ? '  ' + cmd.description : ''}`));
                        });
                        return items;
                    })(),
                    commands.length === 0 ? h(Text, { color: 'red' }, 'No commands found') : null
                )
                : mode === 'form'
                    ? h(Box, { width: '42%', flexDirection: 'column', borderStyle: 'round', borderColor: 'yellow', paddingX: 1 },
                        currentRequiredField?.fieldType === 'select'
                            ? h(Text, { color: 'magentaBright' }, `Select ${currentRequiredField.label} (${selectChoices.length})`)
                            : h(Text, { color: 'magentaBright' }, `Required fields (${requiredFields.length})`),
                        currentRequiredField?.fieldType === 'select'
                            ? visibleSelectChoices.map((choice, index) => {
                                const choiceIndex = index + selectScrollOffset;
                                const isSelected = choiceIndex === selectIndex;
                                return h(Text, {
                                    key: `sc-${choiceIndex}`,
                                    color: isSelected ? 'black' : 'white',
                                    backgroundColor: isSelected ? 'yellow' : undefined,
                                    wrap: 'truncate'
                                }, `${isSelected ? '>' : ' '} ${choice.label}`);
                            }).concat(selectChoices.length > VISIBLE_COUNT
                                ? [h(Text, { key: 'sc-window', color: 'gray' }, `showing ${selectScrollOffset + 1}-${Math.min(selectScrollOffset + VISIBLE_COUNT, selectChoices.length)}/${selectChoices.length}`)]
                                : [])
                            : requiredFields.map((field, index) => {
                                const isSelected = index === requiredFieldIndex;
                                const value = field.type === 'arg' ? activeSelections.args[field.key] : activeSelections.options[field.key];
                                return h(Text, {
                                    key: field.id,
                                    color: isSelected ? 'black' : 'white',
                                    backgroundColor: isSelected ? 'yellow' : undefined,
                                    wrap: 'truncate'
                                }, `${isSelected ? '>' : ' '} ${field.label} - ${value || '(empty)'}`);
                            })
                    )
                    : h(Box, { width: '42%', flexDirection: 'column', borderStyle: 'round', borderColor: 'cyan', paddingX: 1 },
                        h(Text, { color: 'magentaBright' }, `Variants (${variants.length})`),
                        ...visibleVariants.map((v, index) => {
                            const variantItemIndex = index + variantScrollOffset;
                            const isSelected = variantItemIndex === variantIndex;
                            return h(Text, {
                                key: `v-${variantItemIndex}`,
                                color: isSelected ? 'black' : 'white',
                                backgroundColor: isSelected ? 'cyan' : undefined,
                                wrap: 'truncate'
                            }, `${isSelected ? '>' : ' '} ${v.label}`);
                        }),
                        variants.length > VISIBLE_COUNT
                            ? h(Text, { color: 'gray' }, `showing ${variantScrollOffset + 1}-${Math.min(variantScrollOffset + VISIBLE_COUNT, variants.length)}/${variants.length}`)
                            : null
                    ),

            mode !== 'output' && mode !== 'processes' && h(Box, { width: '58%', flexDirection: 'column', borderStyle: 'round', borderColor: 'gray', paddingX: 1 },
                ...(mode === 'browse'
                    ? [
                        h(Text, { key: 'ph', color: 'greenBright' }, 'Preview'),
                        h(Text, { key: 'pv', wrap: 'wrap' }, preview),
                        h(Text, { key: 'e1' }, ''),
                        h(Text, { key: 'gh', color: 'greenBright' }, 'Groups'),
                        h(Text, { key: 'gv', color: 'gray' }, groups.join(', ')),
                        h(Text, { key: 'ih', color: 'yellow' }, 'Interactive-only commands are hidden.'),
                        selected
                            ? h(Text, { key: 'safe', color: selected.hints?.destructive ? 'red' : 'gray' },
                                selected.hints?.destructive ? 'Warning: destructive command' : 'Safe command')
                            : null,
                        selected && issues && !issues.runnable
                            ? h(Text, { key: 'req', color: 'yellow' }, `Requires: ${[
                                ...issues.missingArgs.map((a) => `<${a.key}>`),
                                ...issues.missingOptions.map((o) => o.flag)
                            ].join(', ')}`)
                            : null
                    ]
                    : mode === 'form'
                        ? [
                            h(Text, { key: 'fh', color: 'greenBright' }, 'Input Details'),
                            currentRequiredField
                                ? h(Text, { key: 'f1', color: 'white', bold: true }, `${currentRequiredField.label}`)
                                : null,
                            currentRequiredField
                                ? h(Text, { key: 'f2', color: 'gray' }, currentRequiredField.description)
                                : null,
                            h(Text, { key: 'f3', color: 'gray' }, 'Press Enter to save value and continue.')
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
                                : null
                        ]
                ),

                h(Text, { key: 'e2' }, ''),
                h(Box, { key: 'roh' },
                    h(Text, { color: 'greenBright' }, runState.status === 'running' ? 'Run Output  (running...)' : 'Run Output'),
                    hasOutput ? h(Text, { color: 'gray' }, '  press o to open logs') : null
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
