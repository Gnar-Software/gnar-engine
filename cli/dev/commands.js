// control/commands.js
import { Command } from 'commander';
import { profiles } from '../profiles/profiles.client.js';
import { up } from './dev.service.js';
import path from 'path';

export function registerDevCommands(program) {
	const devCmd = new Command('dev').description('🛠️  Start Gnar Engine Development Environment');

	devCmd
		.command('up')
		.description('🛠️ Up Gnar Engine Development Containers')
		.option('-b, --build', 'Ruild without cache')
        .option('-d, --detach', 'Run containers in background')
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

			try {
				up({
                    projectDir: projectDir,
                    noCache: options.build || false,
                    detach: options.detach || false
                });
			} catch (err) {
				console.error("❌ Error running containers:", err.message);
				process.exit(1);
			}
		});

	program.addCommand(devCmd);
}
