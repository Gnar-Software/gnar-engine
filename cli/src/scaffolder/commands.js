import inquirer from 'inquirer';
import { profiles } from '../profiles/profiles.client.js';
import { scaffolder } from './scaffolder.handler.js';
import path from 'path';

export const registerScaffolderCommands = (program) => {

    const create = program.command('create').description('📦 Scaffold new services and components');

    create
        .command('project <projectName>')
        .description('🚀 Create a new project')
        .action(async (projectName, options) => {
            // validate
            if (!projectName) {
                console.error('❌ Please specify a project name using gnar create project <projectName>');
                return;
            }

            // options
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'projectDir',
                    message: 'Choose directory to create project in',
                    default: path.join(process.cwd())
                }
            ]);

            // create the project
            try {
                scaffolder.createNewProject({
                    projectName: projectName,
                    projectDir: answers.projectDir
                });
            } catch (error) {
                console.error('❌ Error creating project:', error.message);
            }
        });

    create
        .command('service <service>')
        .description('📦 Create a new service: back-end|front-end')
        .action(async (options) => {
            // validate
            if (!options.service) {
                console.error('❌ Please specify a service name using gnar create service <serviceName>');
            }

            let activeProfile;
            try {
                activeProfile = profiles.getActiveProfile();
            } catch (error) {
                console.error('❌ No active profile found. Please create or set one using `gnar profile create` or `gnar profile set-active <profileName>`');
                return;
            }

            // prompt for service details
            const serviceTypeAnswer = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'serviceType',
                    message: 'Service Type',
                    choices: [
                        { name: 'Back-End', value: 'backend' },
                        { name: 'Front-End', value: 'frontend' }
                    ],
                    default: 'backend'
                }
            ]);

            // back-end service
            if (serviceTypeAnswer.serviceType === 'backend') {
                const backendAnswers = await inquirer.prompt([
                    { 
                        type: 'list',
                        name: 'database',
                        message: 'Database',
                        choices: [
                            { name: 'MYSQL', value: 'mysql' },
                            { name: 'Mongo DB', value: 'mongodb' }
                        ],
                        default: 'mongodb'
                    }
                ]);

                // create the service
                try {
                    console.log('Creating new service in... ' + activeProfile.profile.PROJECT_DIR);

                    scaffolder.createNewService({
                        serviceName: options.service,
                        database: backendAnswers.database,
                        projectDir: activeProfile.profile.PROJECT_DIR
                    });

                } catch (error) {
                    console.error('❌ Error creating service:', error.message);
                }
            }

            // front-end service
            else {
                try {
                    console.log('Creating new service in... ' + activeProfile.profile.PROJECT_DIR);

                    scaffolder.createNewFrontEndService({
                        serviceName: options.service,
                        projectDir: activeProfile.profile.PROJECT_DIR
                    });
                } catch (error) {
                    console.error('❌ Error creating service:', error.message);
                }
            }
        });
}
