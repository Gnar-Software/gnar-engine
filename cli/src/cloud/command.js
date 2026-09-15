import { Command } from 'commander';
import inquirer from 'inquirer';
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

    program.addCommand(cloudCommand);
}
