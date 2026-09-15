import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Gnar Engine CLI Profile Client
 */
export const profiles = {

    configPath: path.join(os.homedir(), '.gnarengine', 'config.json'),

    getAllProfiles: function (ignoreNotFound = false) {
        if (!fs.existsSync(this.configPath) && !ignoreNotFound) {
            console.error(`Config file not found at ${this.configPath}`);
        }

        return this.readConfig();
    },

    getActiveProfile: function () {
        const config = this.readConfig();
        const allProfiles = config.profiles || {};

        if (!Object.keys(allProfiles).length) {
            console.error('No profiles found');
            return null;
        }

        return {
            name: config.activeProfile,
            profile: allProfiles[config.activeProfile]
        };
    },

    setActiveProfile: function ({ profileName }) {
        const config = this.readConfig();

        if (!config.profiles?.[profileName]) {
            console.error(`Profile "${profileName}" not found`);
            return;
        }

        config.activeProfile = profileName;

        this.writeConfig(config);
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

    deleteProfile: function ({ profileName }) {
        if (!profileName) {
            throw new Error('Invalid profile name');
        }

        const allProfiles = this.getAllProfiles().profiles || {};

        if (!allProfiles[profileName]) {
            throw new Error(`Profile "${profileName}" not found`);
        }

        const activeProfileName = this.getActiveProfile()?.name;

        if (activeProfileName === profileName) {
            throw new Error(`Cannot delete active profile "${profileName}". Please set another profile as active first.`);
        }

        // Prompt user to confirm deletion in the console
        delete allProfiles[profileName];

        this.saveProfiles(allProfiles);
    },

    saveProfiles: function (profilesObj) {
        // Written back alongside whatever else the file holds, such as the
        // active profile and the gnar cloud settings, rather than over it.
        this.writeConfig({ ...this.readConfig(), profiles: profilesObj });
    },

    /**
     * Read the whole config file.
     *
     * @returns {Object} The file's contents, empty when there is no file yet
     */
    readConfig: function () {
        if (!fs.existsSync(this.configPath)) {
            return {};
        }

        try {
            return JSON.parse(fs.readFileSync(this.configPath, 'utf-8')) || {};
        } catch (err) {
            throw new Error(`${this.configPath} is not valid JSON: ${err.message}`);
        }
    },

    /**
     * Write the whole config file.
     *
     * @param {Object} config Contents to write
     * @returns {void}
     */
    writeConfig: function (config) {
        const dir = path.dirname(this.configPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        }

        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), { mode: 0o600 });

        // The file holds keys in the clear, so it is kept to this account. The
        // mode above only applies to a file being created, and a file written
        // before this did was left readable by anyone on the machine.
        fs.chmodSync(this.configPath, 0o600);
    }
};
