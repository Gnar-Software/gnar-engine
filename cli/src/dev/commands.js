// control/commands.js
import { Command, Option } from 'commander';
import { profiles } from '../profiles/profiles.client.js';
import { up, down } from './dev.service.js';
import path from 'path';

export function registerDevCommands(program) {
	const devCmd = new Command('dev').description('🛠️  Start Gnar Engine Development Environment');

	devCmd
		.command('up')
		.description('🛠️  Up Development Containers')
		.option('-b, --build', 'Build without cache')
        .option('-d, --detach', 'Run containers in background')
        .option('-a, --attach-all', 'Attach all services including database and message queues for debugging')
        .option('-t --test', 'Run all tests with ephemeral databases *NOT IMPLEMENTED')
        .option('--test-service <service>', 'Run the tests for the specified service with ephemeral databases (e.g. --test-service user)')
        .option('--test-mode <mode>', 'Which test directory and environment to run tests in. (e.g. --test-mode localdev). Defaults to "ephemeral" which creates separate databases for testing.')
        .option('--reset-databases, --reset-databases', 'Drop all service databases, re-running all migrations and seeders *NOT IMPLEMENTED')
        .option('--reset-database <service>', 'Drop the specified service database, re-running all migrations and seeders (e.g. --reset-database user)')
        .addOption(new Option('--core-dev').hideHelp())
        .addOption(new Option('--react-dev').hideHelp())
        .addOption(new Option('--bootstrap-dev').hideHelp())
        .action(async (options) => {
			let response = {};

			// Get active profile directory
			const { profile: activeProfile } = profiles.getActiveProfile();

			if (!activeProfile) {
				response.error = 'No active profile found';
				return;
			}

			// Change to the active profile directory
			const projectDir = activeProfile.PROJECT_DIR;

            if (options.testService) {
                options.test = true;
            }

			try {
				up({
                    projectDir: projectDir,
                    build: options.build || false,
                    detach: options.detach || false,
                    coreDev: options.coreDev || false,
                    reactDev: options.reactDev || false,
                    bootstrapDev: options.bootstrapDev || false,
                    test: options.test || false,
                    testService: options.testService || '',
                    testMode: options.testMode || 'ephemeral',
                    resetDatabases: options.resetDatabases || false,
                    resetDatabase: options.resetDatabase || '',
                    attachAll: options.attachAll || false
                 });
			} catch (err) {
				console.error("❌ Error running containers:", err.message);
				process.exit(1);
			}
		});

    devCmd
        .command('down')
        .description('🛠️  Down Development Containers')
        .option('-a, --all-containers', 'Stop all running containers (not just Gnar Engine ones)')
        .action(async (options) => {
            // Get active profile directory
            const { profile: activeProfile } = profiles.getActiveProfile();

            if (!activeProfile) {
                console.error('No active profile found');
                return;
            }

            // Change to the active profile directory
            const projectDir = activeProfile.PROJECT_DIR;

            try {
				down({
                    projectDir: projectDir,
                    allContainers: options.allContainers || false 
                });
			} catch (err) {
				console.error("❌ Error running containers:", err.message);
				process.exit(1);
			}
        });

	program.addCommand(devCmd);
}
