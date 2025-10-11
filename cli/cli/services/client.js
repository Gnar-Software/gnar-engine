import axios from 'axios';
import { profiles } from '../profiles/profiles.client.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

let client;
let profile;
let profileName;
let baseApiUrl;
let authToken;
let username;
let apiKey;

/**
 * Initialise the profile
 */
export const initAxiosClient = () => {
    // Determine the correct API URL based on the environment
    try {
        profile = profiles.getActiveProfile();
        baseApiUrl = profile.profile.CLI_API_URL;
        username = profile.profile.CLI_API_USERNAME;
        apiKey = profile.profile.CLI_API_KEY;
        profileName = profile.name;

        console.log('Profile: ' + profile.name + ' | ' + baseApiUrl);

    } catch (error) {
        console.error('Error retrieving active profile:', error.message);
        throw new Error('Active profile not found. Please set an active profile using `gnar profile set-active <profileName>`');
    }

    // Create axios client
    client = axios.create({
        baseURL: baseApiUrl,
        withCredentials: true,
    });

    // Request interceptors
    client.interceptors.request.use(
        async (config) => {

            // Return pre-existing acces token if we have one
            try {
                authToken = await getAccessToken({activeProfileName: profileName});

                if (authToken) {
                    config.headers['Authorization'] = `Bearer ${authToken}`;
                }

                return config;
            } catch (error) {
                //console.log('No access token found, authenticating...');
            }

            // Authenticate if no token is found
            try {
                const authResponse = await axios.post(`${baseApiUrl}/authenticate/`, {
                    username: username,
                    apiKey: apiKey
                });          

                if (!authResponse.data?.token) {
                    throw new Error('Authentication failed', authResponse.data?.error || 'No token received');
                }

                authToken = authResponse.data.token;

                setAccessToken({
                    activeProfileName: profileName,
                    accessToken: authToken,
                    accessTokenExpires: new Date(Date.now() + 3600000).toISOString()
                });

                if (authToken) {
                    config.headers['Authorization'] = `Bearer ${authToken}`;
                }

                return config;
            } catch (error) {
                console.error('Authentication failed:', error.response?.data?.message || error.message);
                throw error;
            }
        },
        (error) => {
            return Promise.reject(error);
        }
    );
}


export default client;


/**
 * Get data resource
 */
export const getDataResource = async (resourceSlug) => {
    try {
        const response = await client.get(`/data/${resourceSlug}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

/**
 * Get access token
 * 
 * @param {Object} options - Options for getting the access token
 * @param {string} options.activeProfileName - The name of the active profile
 * @returns {Promise<string>} - The access token
 * @throws {Error} - If the access token is not found or has expired
 */
export const getAccessToken = async ({activeProfileName}) => {

    let accessToken = null;
    let accessTokenExpires = null;

    try {
        const profileCachePath = path.join(os.homedir(), '.gnarengine', activeProfileName + '.json');
        const profileCache = JSON.parse(fs.readFileSync(profileCachePath, 'utf-8'));
        accessToken = profileCache.accessToken;
        accessTokenExpires = profileCache.accessTokenExpires;

        if (!accessToken || !accessTokenExpires) {
            throw new Error('Access token or expiration not found in cache');
        }

        if (new Date(accessTokenExpires) < new Date()) {
            throw new Error('Access token has expired');
        }
    } catch (error) {
        throw error;
    }

    return accessToken;
}

/**
 * Set access token
 * 
 * @param {Object} options - Options for setting the access token
 * @param {string} options.activeProfileName - The name of the active profile
 * @param {string} options.accessToken - The access token to set
 * @param {Date} options.accessTokenExpires - The expiration date of the access token
 * @returns {Promise<void>}
 * @throws {Error} - If unable to write to the profile cache file
 */
export const setAccessToken = async ({activeProfileName, accessToken, accessTokenExpires}) => {
    try {
        let profileCache = {};

        const profileCachePath = path.join(os.homedir(), '.gnarengine', activeProfileName + '.json');

        if (fs.existsSync(profileCachePath)) {
            try {
                profileCache = JSON.parse(fs.readFileSync(profileCachePath, 'utf-8'));
            } catch (error) {

            }
        } else {
            fs.mkdirSync(path.dirname(profileCachePath), { recursive: true });
        }

        profileCache.accessToken = accessToken;
        profileCache.accessTokenExpires = accessTokenExpires;

        fs.writeFileSync(profileCachePath, JSON.stringify(profileCache, null, 2));
    } catch (error) {
        throw new Error('Unable to write to profile cache file: ' + error.message);
    }
}
