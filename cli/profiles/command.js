// init/commands.js
import { Command } from 'commander';
import { profiles } from './profiles.client.js';
import inquirer from 'inquirer';
import fs from 'fs';
import os from 'os';
import path from 'path';


export function registerProfileCommand(program) {
    const profile = new Command('profile').description('👤 Manage CLI profiles');

    // profile get all
    profile
        .command('get-all')
        .description('List all profiles')
        .action(() => {
            const config = profiles.getAllProfiles();

            if (!config || !config.profiles || Object.keys(config.profiles).length === 0) {
                console.error('No profiles found. Please create a profile using gnar profile create');
                return;
            }

            Object.keys(config.profiles).forEach((p) => {
                if (config.activeProfile == p) {
                    console.log('- ' + p + ' (active)');
                } else {
                    console.log('- ' + p);
                }
            });
        });

    // profile get active
    profile
        .command('get-active')
        .description('Show the active profile')
        .action(() => {
            try {
                const {name, profile} = profiles.getActiveProfile();
                console.log(`Active profile: ${name}`);
            } catch (error) {
                console.error('No active profile found. Please set one using `gnar profile set-active <profileName>`');
            }
        });

    // profile set active <profileName>
    profile
        .command('set-active')
        .description('Select active profile')
        .action(() => {
            try {
                const allProfiles = profiles.getAllProfiles();
                const choices = Object.keys(allProfiles.profiles).map((p) => {
                    if (allProfiles.activeProfile == p) {
                        return { name: p + ' (active)', value: p };
                    } else {
                        return { name: p, value: p };
                    }
                });

                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'profileName',
                        message: 'Select a profile to set as active:',
                        choices: choices
                    }
                ]).then((answers) => {
                    const profileName = answers.profileName;
                    profiles.setActiveProfile({
                        profileName: profileName
                    });
                    console.log(`✅ Profile "${profileName}" set as active.`);
                });

                return;
            } catch (error) {
                console.error(`❌ Error setting active profile: ${error.message}`);
            }
        });

    // profile create
    profile
        .command('create')
        .description('Create a new profile')
        .action(async () => {
            const answers = await inquirer.prompt([
                { name: 'profile', message: 'Profile name', default: 'mywebsite:local'  },
                { name: 'CLI_API_URL', message: 'API URL', default: 'http://localhost' },
                { name: 'CLI_API_USERNAME', message: 'API Username', default: 'gnarlyroot' },
                { name: 'CLI_API_KEY', message: 'API Key' },
                { name: 'PROJECT_DIR', message: 'Project directory', default: process.cwd() },
                { name: 'AWS_ACCESS_KEY_ID', message: 'AWS Access Key' },
                { name: 'AWS_SECRET_ACCESS_KEY', message: 'AWS Secret Access Key' },
                { name: 'AWS_REGION', message: 'AWS Region' },
                {
                    type: 'confirm',
                    name: 'setActive',
                    message: 'Set this profile as active?',
                    default: true,
                },
            ]);

            const profileName = answers.profile;
            const config = {
                CLI_API_URL: answers.CLI_API_URL,
                CLI_API_USERNAME: answers.CLI_API_USERNAME,
                CLI_API_KEY: answers.CLI_API_KEY,
                PROJECT_DIR: answers.PROJECT_DIR || process.cwd(),
                AWS_ACCESS_KEY_ID: answers.AWS_ACCESS_KEY_ID,
                AWS_SECRET_ACCESS_KEY: answers.AWS_SECRET_ACCESS_KEY,
                AWS_REGION: answers.AWS_REGION
            };
            
            // save profile to config file
            profiles.createProfile({ 
                profileName: profileName,
                config: config
            });

            // set active profile if required
            if (answers.setActive) {
                console.log('setting active', );
                profiles.setActiveProfile({
                    profileName: profileName
                });
            }
        });

    // update profile
    profile
        .command('update <profileName>')
        .description('Update an existing profile')
        .action(async (profileName) => {
            const allProfiles = profiles.getAllProfiles();

            if (!allProfiles.profiles[profileName]) {
                console.error(`Profile "${profileName}" not found.`);
                return;
            }

            const currentProfile = allProfiles.profiles[profileName];
            const answers = await inquirer.prompt([
                { name: 'CLI_API_URL', message: 'API URL', default: currentProfile.CLI_API_URL },
                { name: 'CLI_API_USERNAME', message: 'API Username', default: currentProfile.CLI_API_USERNAME },
                { name: 'CLI_API_KEY', message: 'API Key', default: currentProfile.CLI_API_KEY },
                { name: 'PROJECT_DIR', message: 'Project directory', default: currentProfile.PROJECT_DIR || process.cwd() },
                { name: 'AWS_ACCESS_KEY_ID', message: 'AWS Access Key', default: currentProfile.AWS_ACCESS_KEY_ID },
                { name: 'AWS_SECRET_ACCESS_KEY', message: 'AWS Secret Access Key', default: currentProfile.AWS_SECRET_ACCESS_KEY },
                { name: 'AWS_REGION', message: 'AWS Region', default: currentProfile.AWS_REGION }
            ]);

            // update profile
            profiles.updateProfile({
                profileName: profileName,
                config: {
                    CLI_API_URL: answers.CLI_API_URL,
                    CLI_API_USERNAME: answers.CLI_API_USERNAME,
                    CLI_API_KEY: answers.CLI_API_KEY,
                    PROJECT_DIR: answers.PROJECT_DIR || process.cwd(),
                    AWS_ACCESS_KEY_ID: answers.AWS_ACCESS_KEY_ID,
                    AWS_SECRET_ACCESS_KEY: answers.AWS_SECRET_ACCESS_KEY,
                    AWS_REGION: answers.AWS_REGION
                }
            });
        });

    program.addCommand(profile);
}
