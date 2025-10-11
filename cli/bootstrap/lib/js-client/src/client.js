import axios from 'axios';

import { getAuthToken, setAuthToken, removeAuthToken, removeAuthUser } from './storage.js';

// Determine the correct API URL based on the environment
const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;

const client = axios.create({
    baseURL: baseApiUrl,
    withCredentials: true,
});

// SDK Initialization
let sdkInstance = null;

export const initialiseGnarSdk = () => {
    if (!baseApiUrl) {
        throw new Error("Base API URL is required for Gnar SDK initialization");
    }

    sdkInstance = {
        baseApiUrl
    };

    console.log(`Gnar SDK initialized with baseApiUrl: ${baseApiUrl}`);
};

export const getGnarSdk = () => {
    if (!sdkInstance) {
        throw new Error("Gnar SDK has not been initialized. Call initialiseGnarSdk first.");
    }
    return sdkInstance;
};


// Attach authorisation header to requests
client.interceptors.request.use(
    (config) => {
        // Authorization header
        let authToken = getAuthToken();

        console.log('authToken', authToken);

        if (authToken) {
            config.headers['Authorization'] = `Bearer ${authToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

client.interceptors.response.use(
    (response) => {
        // update auth token if new one provided
        const newAuthToken = response.headers['authorization'];

        if (newAuthToken) {
            const token = newAuthToken.split(' ')[1];
            setAuthToken(token);
            console.log('refreshed token');
        }

        return response;
    },
    (error) => {
        // Log out if 401
        if (error.response.status === 401) {

            // remove auth token and user from storage
            removeAuthToken();
            removeAuthUser();

            // redirect to login page
            // window.location.href = '/login'

        }

        return Promise.reject(error);
    }
);

export default client;


/**
 * Send password reset
 * 
 * @param {int} userId
 * @param {string} email
 */
export const sendPasswordReset = async ({userId, email}) => {

    if (!userId && !email) {
        throw new Error('No user id or email provided');
    }

    if (userId) {
        try {
            const response = await client.get(`/user/${userId}/pswd-reset-request`);
            return response.data;
        } catch (error) {
            throw error;
        }
    } else if (email) {
        try {
            const response = await client.post(`/user/pswd-reset-request`, {
                email: email
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

/**
 * Reset password
 * 
 * @param {string} email
 * @param {string} token
 * @param {string} password
 */

export const resetPassword = async ({email, token, password}) => {
    try {
        const response = await client.post(`/user/pswd-reset`, {
            email: email,
            token: token,
            password: password
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

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

