import { profiles } from '../profiles/profiles.client.js';

/**
 * Gnar Cloud settings, held alongside the profiles in ~/.gnarengine/config.json
 */
export const cloud = {

    defaultApiUrl: 'https://api.gnarcloud.com',

    /**
     * Where the settings are kept.
     *
     * @returns {string} Path to the config file
     */
    configLocation() {
        return profiles.configPath;
    },

    /**
     * Read the Gnar Cloud settings.
     *
     * @returns {Object} apiUrl, email and key, empty where nothing is set
     */
    getSettings() {
        return profiles.readConfig().gnarcloud || {};
    },

    /**
     * Write the Gnar Cloud settings, leaving the profiles alone.
     *
     * @param {Object} settings What to store under gnarcloud
     * @returns {Object} The settings as stored
     */
    saveSettings(settings) {
        const config = profiles.readConfig();

        config.gnarcloud = { ...config.gnarcloud, ...settings };

        profiles.writeConfig(config);

        return config.gnarcloud;
    },

    /**
     * The settings needed to reach Gnar Cloud, or a reason they are not there.
     *
     * @returns {Object} settings and a message naming what is missing
     */
    requireSettings() {
        const settings = cloud.getSettings();
        const missing = ['apiUrl', 'email', 'key'].filter(field => !settings[field]);

        if (missing.length) {
            throw new Error(`Gnar Cloud is not configured (${missing.join(', ')} missing). Run: gnar cloud configure`);
        }

        return settings;
    }
};
