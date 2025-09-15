// control/commands.js
import { Command } from 'commander';
import { control } from './control.client.js';
import inquirer from 'inquirer';

export function registerControlCommands(program) {
	const controlCmd = new Command('control').description('Control related commands');

	controlCmd
		.command('migrate')
		.description('📦 Run migrations')
		.option('-a, --all', 'Run all migrations')
		.option('-s, --service <service>', 'Run migrations for a specific service')
		.option('-m, --migration <migration>', 'Run a specific migration (must also include service)')
		.action(async (options) => {
			let response = {};

			if (options.all) {
				console.log('📦 Running all migrations...');
				response = await control.runMigrations();
			} else {
				response.error = 'No options provided';
			}

			if (response.error) {
				console.error('❌ ' + response.error);
			} else {
				console.log('✅ ' + response.message);
			}
		});

	controlCmd
		.command('seed')
		.description('🌱 Run seeders')
		.option('-a, --all', 'Run all seeders')
		.option('-s, --service <service>', 'Run seeders for a specific service')
		.option('-S, --seed <seed>', 'Run a specific seed (must also include service)')
		.action(async (options) => {
			let response = {};

			if (options.all) {
				console.log('🌱 Running all seeders...');
				response = await control.runSeeders();
			} else {
				response.error = 'No options provided';
			}

			if (response.error) {
				console.error('❌ ' + response.error);
			} else {
				console.log('✅ ' + response.message);
			}
		});

	controlCmd
		.command('reset')
		.description('📦 Full Reset. Drop all data to return to initial state with root user only (development mode only)')
		.option('-a, --all', 'Reset everything')
		.option('-s, --service <service>', 'Run migrations for a specific service')
		.action(async (options) => {
			let response = {};

			if (options.all) {
				const confirmation = await inquirer.prompt([
					{
						type: 'confirm',
						name: 'confirmReset',
						message: '⚠️  Are you sure you want to run a full reset? This will delete all data.',
						default: false,
					},
				]);

				if (!confirmation.confirmReset) {
					console.log('❌ Reset cancelled.');
					return;
				}

				console.log('📦 Running full reset...');
				response = await control.runReset();
			} else {
				response.error = 'No options provided';
			}

			if (response.error) {
				console.error('❌ ' + response.error);
			} else {
				console.log('✅ ' + response.message);
			}
		});

	controlCmd
		.command('get-tasks')
		.description('🛠️  Get tasks')
		.option('-s, --status <status>', 'Task status (default: scheduled)')
		.action(async (options) => {
			if (!options.status) options.status = 'scheduled';

			console.log('🛠️  Getting tasks with status: ' + options.status);
			const response = await control.getTasks(options.status);

			if (response.error) {
				console.error('❌ ' + response.error);
			} else {
				console.log(JSON.stringify(response.tasks, null, 2));
				console.log('✅ Got tasks ' + response.tasks.length);
			}
		});

	controlCmd
		.command('execute-tasks')
		.description('🛠️  Execute tasks')
		.option('-s, --status <status>', 'Task status (default: scheduled)')
		.action(async (options) => {
			if (!options.status) options.status = 'scheduled';

			console.log('🛠️  Executing tasks with status: ' + options.status);
			const response = await control.handleTaskBatch(options.status);

			if (response.error) {
				console.error('❌ ' + response.error);
			} else {
				console.log('✅ ' + response.message);
			}
		});

	controlCmd
		.command('delete-task')
		.description('🛠️  Delete task')
		.requiredOption('-id, --id <id>', 'Task ID')
		.action(async (options) => {
			console.log('🛠️  Deleting task with id: ' + options.id);
			const response = await control.deleteTask(options.id);

			if (response.error) {
				console.error('❌ ' + response.error);
			} else {
				console.log('✅ ' + response.numDeletedTasks + ' ' + response.message);
			}
		});

	controlCmd
		.command('delete-failed-tasks')
		.description('🛠️  Delete failed tasks')
		.action(async () => {
			console.log('🛠️  Deleting failed tasks');
			const response = await control.deleteFailedTasks();

			if (response.error) {
				console.error('❌ ' + response.error);
			} else {
				console.log('✅ ' + response.numDeletedTasks + ' ' + response.message);
			}
		});

	program.addCommand(controlCmd);
}
