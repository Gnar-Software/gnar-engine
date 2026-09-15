import { profiles } from '../profiles/profiles.client.js';

/**
 * Gnar Cloud settings, held alongside the profiles in ~/.gnarengine/config.json
 */
export const cloud = {

    defaultApiUrl: 'https://api.gnarcloud.com',

    /**
     * A key described rather than shown.
     *
     * Its length is given because a key fully hidden gives no way to tell a
     * real one from something typed to get past the prompt.
     *
     * @param {string} key The stored key
     * @returns {string} Something safe to print
     */
    maskKey(key) {
        if (!key) {
            return '(not set)';
        }

        return `${'*'.repeat(12)} (${key.length} characters)`;
    },

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
     * Trade the stored email and key for a session token.
     *
     * The token belongs to the Gnar Cloud user rather than to any project, so
     * one is held for the machine and reused until Gnar Cloud stops accepting
     * it.
     *
     * @returns {Promise<string>} The session token
     */
    async authenticate() {
        const settings = cloud.requireSettings();

        let response;

        try {
            response = await fetch(`${settings.apiUrl}/authenticate/`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: settings.email, apiKey: settings.key })
            });
        } catch (err) {
            throw new Error(`Could not reach Gnar Cloud at ${settings.apiUrl} (${err.cause?.code || err.message}). Check the address with: gnar cloud show`);
        }

        if (!response.ok) {
            const detail = await response.text().catch(() => '');

            throw new Error(`Gnar Cloud refused the email and key for ${settings.email} (${response.status}). ${detail}`.trim());
        }

        const { token } = await response.json();

        if (!token) {
            throw new Error('Gnar Cloud accepted the sign in but returned no session token');
        }

        cloud.saveSettings({ sessionToken: token });

        return token;
    },

    /**
     * Call Gnar Cloud with the session token attached.
     *
     * A token that is no longer accepted is replaced once and the call tried
     * again, so an expired one does not need to be dealt with by hand.
     *
     * @param {string} path Path below the api address
     * @param {Object} [options] As fetch takes
     * @returns {Promise<Object>} The decoded response body
     */
    async request(path, options = {}) {
        const settings = cloud.requireSettings();
        const token = settings.sessionToken || await cloud.authenticate();

        const send = async (sessionToken) => fetch(`${settings.apiUrl}${path}`, {
            ...options,
            headers: {
                'content-type': 'application/json',
                ...options.headers,
                authorization: `Bearer ${sessionToken}`
            }
        });

        let response;

        try {
            response = await send(token);
        } catch (err) {
            throw new Error(`Could not reach Gnar Cloud at ${settings.apiUrl} (${err.cause?.code || err.message}). Check the address with: gnar cloud show`);
        }

        if (response.status === 401 || response.status === 403) {
            response = await send(await cloud.authenticate());
        }

        if (!response.ok) {
            const detail = await response.text().catch(() => '');

            throw new Error(`Gnar Cloud answered ${response.status} for ${path}. ${detail}`.trim());
        }

        return await response.json().catch(() => ({}));
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
