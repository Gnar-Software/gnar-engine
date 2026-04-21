const commandCatalog = [
    {
        id: 'dev.up',
        group: 'dev',
        command: 'up',
        description: 'Up Development Containers',
        args: [],
        options: [
            { key: 'build', type: 'boolean', flag: '--build', shortFlag: '-b', description: 'Build without cache' },
            { key: 'detach', type: 'boolean', flag: '--detach', shortFlag: '-d', description: 'Run containers in background' },
            { key: 'attachAll', type: 'boolean', flag: '--attach-all', shortFlag: '-a', description: 'Attach all services including DBs for debugging' },
            { key: 'coreDev', type: 'boolean', flag: '--core-dev', description: 'Use local core/dist/core.js instead of npm package' },
            { key: 'bootstrapDev', type: 'boolean', flag: '--bootstrap-dev', description: 'Use local bootstrap services instead of npm package' },
            { key: 'test', type: 'boolean', flag: '--test', shortFlag: '-t', description: 'Run all tests with ephemeral databases' },
            { key: 'testService', type: 'string', flag: '--test-service', description: 'Run tests for a specific service (e.g. user)' },
            { key: 'testMode', type: 'string', flag: '--test-mode', description: 'Test mode — ephemeral (default), localdev' },
            { key: 'resetDatabases', type: 'boolean', flag: '--reset-databases', description: 'Drop all service databases' },
            { key: 'resetDatabase', type: 'string', flag: '--reset-database', description: 'Drop one service database (e.g. user)' }
        ],
        hints: { requiresProfile: true }
    },
    {
        id: 'dev.down',
        group: 'dev',
        command: 'down',
        description: 'Down Development Containers',
        args: [],
        options: [
            { key: 'allContainers', type: 'boolean', flag: '--all-containers', shortFlag: '-a', description: 'Stop all running containers' }
        ],
        hints: { requiresProfile: true }
    },
    {
        id: 'profile.get-all',
        group: 'profile',
        command: 'get-all',
        description: 'List all profiles',
        args: [],
        options: [],
        hints: {}
    },
    {
        id: 'profile.get-active',
        group: 'profile',
        command: 'get-active',
        description: 'Show active profile',
        args: [],
        options: [],
        hints: {}
    },
    {
        id: 'profile.set-active',
        group: 'profile',
        command: 'set-active',
        description: 'Select active profile',
        args: [],
        options: [],
        hints: {}
    },
    {
        id: 'profile.create',
        group: 'profile',
        command: 'create',
        description: 'Create a new profile',
        args: [],
        options: [],
        hints: {}
    },
    {
        id: 'profile.update',
        group: 'profile',
        command: 'update',
        description: 'Update an existing profile',
        args: [
            { key: 'profileName', description: 'Profile name', required: true }
        ],
        options: [],
        hints: {}
    },
    {
        id: 'profile.delete',
        group: 'profile',
        command: 'delete',
        description: 'Delete an existing profile',
        args: [
            { key: 'profileName', description: 'Profile name', required: true }
        ],
        options: [],
        hints: { destructive: true, confirmMessage: 'Delete selected profile?' }
    },
    {
        id: 'control.migrate',
        group: 'control',
        command: 'migrate',
        description: 'Run migrations',
        args: [],
        options: [
            { key: 'all', type: 'boolean', flag: '--all', shortFlag: '-a', description: 'Run all migrations' },
            { key: 'service', type: 'string', flag: '--service', shortFlag: '-s', description: 'Service name' },
            { key: 'migration', type: 'string', flag: '--migration', shortFlag: '-m', description: 'Migration name' }
        ],
        hints: { requiresProfile: true }
    },
    {
        id: 'control.seed',
        group: 'control',
        command: 'seed',
        description: 'Run seeders',
        args: [],
        options: [
            { key: 'all', type: 'boolean', flag: '--all', shortFlag: '-a', description: 'Run all seeders' },
            { key: 'service', type: 'string', flag: '--service', shortFlag: '-s', description: 'Service name' },
            { key: 'seed', type: 'string', flag: '--seed', shortFlag: '-S', description: 'Seed name' }
        ],
        hints: { requiresProfile: true }
    },
    {
        id: 'control.reset',
        group: 'control',
        command: 'reset',
        description: 'Full reset to initial state',
        args: [],
        options: [
            { key: 'all', type: 'boolean', flag: '--all', shortFlag: '-a', description: 'Reset everything' },
            { key: 'service', type: 'string', flag: '--service', shortFlag: '-s', description: 'Service name' }
        ],
        hints: { requiresProfile: true, destructive: true, confirmMessage: 'Run full reset and potentially delete data?' }
    },
    {
        id: 'control.get-tasks',
        group: 'control',
        command: 'get-tasks',
        description: 'Get tasks',
        args: [],
        options: [
            { key: 'status', type: 'string', flag: '--status', shortFlag: '-s', description: 'Task status (default: scheduled)' }
        ],
        hints: { requiresProfile: true }
    },
    {
        id: 'control.execute-tasks',
        group: 'control',
        command: 'execute-tasks',
        description: 'Execute tasks',
        args: [],
        options: [
            { key: 'status', type: 'string', flag: '--status', shortFlag: '-s', description: 'Task status (default: scheduled)' }
        ],
        hints: { requiresProfile: true }
    },
    {
        id: 'control.delete-task',
        group: 'control',
        command: 'delete-task',
        description: 'Delete task by id',
        args: [],
        options: [
            { key: 'id', type: 'string', flag: '--id', required: true, description: 'Task ID' }
        ],
        hints: { requiresProfile: true, destructive: true, confirmMessage: 'Delete the selected task?' }
    },
    {
        id: 'control.delete-failed-tasks',
        group: 'control',
        command: 'delete-failed-tasks',
        description: 'Delete failed tasks',
        args: [],
        options: [],
        hints: { requiresProfile: true, destructive: true, confirmMessage: 'Delete all failed tasks?' }
    },
    {
        id: 'create.project',
        group: 'create',
        command: 'project',
        description: 'Create a new project',
        args: [
            { key: 'projectName', description: 'Project name', required: true }
        ],
        options: [],
        hints: {}
    },
    {
        id: 'create.service',
        group: 'create',
        command: 'service',
        description: 'Create a new service',
        args: [
            { key: 'service', description: 'Service name', required: true }
        ],
        options: [],
        hints: { requiresProfile: true }
    },
    {
        id: 'create.entity',
        group: 'create',
        command: 'entity',
        description: 'Create a new entity in an existing service',
        args: [
            { key: 'entity', description: 'Entity name', required: true }
        ],
        options: [
            { key: 'inService', type: 'string', flag: '--in-service', required: true, description: 'Service name' }
        ],
        hints: { requiresProfile: true }
    },
    {
        id: 'agent.session',
        group: 'agent',
        command: 'session',
        description: 'Prompt the engine agent',
        args: [],
        options: [],
        hints: {}
    }
];

export function getCommandCatalog() {
    return commandCatalog;
}

export function getGroups() {
    return [...new Set(commandCatalog.map((entry) => entry.group))];
}

export function searchCommands(query) {
    const term = query.trim().toLowerCase();

    if (!term) {
        return commandCatalog;
    }

    return commandCatalog.filter((entry) => {
        const haystack = `${entry.group} ${entry.command} ${entry.description}`.toLowerCase();
        return haystack.includes(term);
    });
}
