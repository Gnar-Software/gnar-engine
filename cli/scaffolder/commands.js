import inquirer from 'inquirer';
import { profiles } from '../profiles/profiles.client.js';
import { scaffolder } from './scaffolder.handler.js';

export const registerScaffolderCommands = (program) => {

    program
        .command('create')
        .description('📦 Create new service')
        .option('-s, --service <service>', 'Create a new service')
        .action(async (options) => {
            // validate
            if (!options.service) {
                console.error('❌ Please specify a service to create using the -s or --service option.');
            }

            let activeProfile;
            try {
                activeProfile = profiles.getActiveProfile();
            } catch (error) {
                console.error('❌ No active profile found. Please create or set one using `gnar profile create` or `gnar profile set-active <profileName>`');
                return;
            }

            // prompt for service details
            const answers = await inquirer.prompt([
                { type: 'list',
                    name: 'database',
                    message: 'Database',
                    choices: [
                        { name: 'MYSQL', value: 'mysql' },
                        { name: 'Mongo DB', value: 'mongodb' }
                    ],
                    default: 'mongodb'
                },
            ]);

            // create the service
            try {
                console.log('Creating new service in... ' + activeProfile.profile.PROJECT_DIR);

                scaffolder.createNewService({
                    serviceName: options.service,
                    database: answers.database,
                    projectDir: activeProfile.profile.PROJECT_DIR
                });

            } catch (error) {
                console.error('❌ Error creating service:', error.message);
            }
        });
}
