import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { cloud } from './cloud.client.js';

export function registerCloudCommands(program) {
    const cloudCommand = new Command('cloud').description('☁️  Talk to Gnar Cloud');

    // cloud configure
    cloudCommand
        .command('configure')
        .description('Store the address, email and key this machine reaches Gnar Cloud with')
        .action(async () => {
            const existing = cloud.getSettings();

            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'apiUrl',
                    message: 'Gnar Cloud API base url:',
                    default: existing.apiUrl || cloud.defaultApiUrl
                },
                {
                    type: 'input',
                    name: 'email',
                    message: 'Email you registered with:',
                    default: existing.email,
                    validate: value => value.includes('@') || 'That does not look like an email address'
                },
                {
                    type: 'password',
                    name: 'key',
                    mask: '*',
                    message: existing.key ? 'Private key (leave blank to keep the one stored):' : 'Private key:'
                }
            ]);

            if (!answers.key) {
                if (!existing.key) {
                    console.error('❌ A private key is required');
                    return;
                }

                delete answers.key;
            }

            answers.apiUrl = answers.apiUrl.replace(/\/+$/, '');

            const saved = cloud.saveSettings(answers);

            console.log(`✅ Saved to ${cloud.configLocation()}`);
            console.log(`   api url: ${saved.apiUrl}`);
            console.log(`   email:   ${saved.email}`);
            console.log(`   key:     ${cloud.maskKey(saved.key)}`);
        });

    // cloud show
    cloudCommand
        .command('show')
        .description('Show what this machine is configured to reach')
        .action(() => {
            const settings = cloud.getSettings();

            if (!Object.keys(settings).length) {
                console.error('Gnar Cloud is not configured. Run: gnar cloud configure');
                return;
            }

            console.log(`   api url: ${settings.apiUrl || '(not set)'}`);
            console.log(`   email:   ${settings.email || '(not set)'}`);
            console.log(`   key:     ${cloud.maskKey(settings.key)}`);
        });

    // cloud login
    cloudCommand
        .command('login')
        .description('Trade the stored email and key for a session token')
        .action(async () => {
            try {
                await cloud.authenticate();

                const settings = cloud.getSettings();

                console.log(`✅ Signed in to ${settings.apiUrl} as ${settings.email}`);
            } catch (err) {
                console.error(`❌ ${err.message}`);
                process.exitCode = 1;
            }
        });

    // cloud put-secrets
    cloudCommand
        .command('put-secrets')
        .description("Send this environment's yml to Gnar Cloud")
        .action(async () => {
            try {
                const { projectId, environmentName, projectDir } = await cloud.resolveEnvironment();
                const file = path.join(projectDir, `deploy.${environmentName}.yml`);

                if (!fs.existsSync(file)) {
                    console.error(`❌ ${file} does not exist`);
                    process.exitCode = 1;
                    return;
                }

                const contents = fs.readFileSync(file, 'utf8');

                const result = await cloud.request(`/secrets/${projectId}/${environmentName}`, {
                    method: 'PUT',
                    body: JSON.stringify({ secrets: contents })
                });

                console.log(`✅ Sent ${file} to ${environmentName}`);

                if (result?.arn || result?.secret?.arn) {
                    console.log(`   stored as ${result.arn || result.secret.arn}`);
                }
            } catch (err) {
                console.error(`❌ ${err.message}`);
                process.exitCode = 1;
            }
        });

    // cloud get-secrets
    cloudCommand
        .command('get-secrets')
        .description("Fetch this environment's yml from Gnar Cloud and write it out")
        .action(async () => {
            try {
                const { projectId, environmentName, projectDir } = await cloud.resolveEnvironment();

                const result = await cloud.request(`/secrets/${projectId}/${environmentName}`);
                const contents = result?.secrets ?? result?.secret ?? '';

                if (!contents) {
                    console.error(`❌ Gnar Cloud holds nothing for ${environmentName}`);
                    process.exitCode = 1;
                    return;
                }

                const file = path.join(projectDir, `deploy.${environmentName}.yml`);

                console.log(contents);

                fs.writeFileSync(file, contents);

                console.log(`✅ Written to ${file}`);
            } catch (err) {
                console.error(`❌ ${err.message}`);
                process.exitCode = 1;
            }
        });

    program.addCommand(cloudCommand);
}
