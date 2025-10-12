import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Gnar Engine CLI Profile Client
 */
export const profiles = {

    configPath: path.join(os.homedir(), '.gnarengine', 'config.json'),

    getAllProfiles: function (ignoreNotFound = false) {
        if (!fs.existsSync(this.configPath)) {
            if (!ignoreNotFound) {
                console.error(`Config file not found at ${this.configPath}`);
            }
            return {};
        }

        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        return config || {};
    },

    getActiveProfile: function () {
        const allProfiles = this.getAllProfiles();

        if (!allProfiles || Object.keys(allProfiles).length === 0) {
            console.error('No profiles found');
            return null;
        }

        if (!fs.existsSync(this.configPath)) {
            if (!ignoreNotFound) {
                console.error(`Config file not found at ${this.configPath}`);
            }
            return {};
        }

        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        const activeProfile = config.activeProfile;

        return { 
            name: activeProfile, 
            profile: allProfiles.profiles[activeProfile]
        };
    },

    setActiveProfile: function ({ profileName }) {
        if (!fs.existsSync(this.configPath)) {
            console.error(`Config file not found at ${this.configPath}`);
            return;
        }

        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        config.activeProfile = profileName;
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    },

    createProfile: function ({ profileName, config }) {
        if (!profileName || !config.CLI_API_URL || !config.CLI_API_USERNAME) {
            throw new Error('Invalid profile data');
        }

        const ignoreNotFound = true;
        const allProfiles = this.getAllProfiles(ignoreNotFound).profiles || {};

        if (allProfiles[profileName]) {
            throw new Error(`Profile "${profileName}" already exists`);
        }

        allProfiles[profileName] = config;

        this.saveProfiles(allProfiles);
        return allProfiles[profileName];
    },

    updateProfile: function ({ profileName, config }) {
        if (!profileName || !config.CLI_API_URL || !config.CLI_API_USERNAME || !config.CLI_API_KEY) {
            throw new Error('Invalid profile data');
        }

        const allProfiles = this.getAllProfiles().profiles || {};

        if (!allProfiles[profileName]) {
            throw new Error(`Profile "${profileName}" not found`);
        }

        allProfiles[profileName] = config;

        this.saveProfiles(allProfiles);
    },

    saveProfiles: function (profilesObj) {
        const dir = path.dirname(this.configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(this.configPath, JSON.stringify({profiles: profilesObj}, null, 2));
    }
};
