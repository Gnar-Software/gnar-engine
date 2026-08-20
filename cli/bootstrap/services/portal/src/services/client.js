import axios from 'axios';

import { getAuthToken, setAuthToken, removeAuthToken, removeAuthUser } from './storage.js';

// Determine the correct API URL based on the environment
const baseApiUrl = 'http://localhost';

const client = axios.create({
    baseURL: baseApiUrl,
    withCredentials: true,
});

// Attach authorisation header to requests
client.interceptors.request.use(
    (config) => {
        // Authorization header
        let authToken = getAuthToken();

        if (authToken) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${authToken}`;
        }

        // add content-type application/json to config.headers
        config.headers['Content-Type'] = 'application/json';

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
            setAuthToken({ authToken: token });
            console.log('refreshed token');
        }

        return response;
    },
    (error) => {
        // Log out if 401
        if (error.response?.status === 401) {

            // remove auth token and user from storage
            removeAuthToken();
            removeAuthUser();

            // Avoid redirect loop if already on login
            if (!window.location.pathname.startsWith('/portal/login')) {
                window.location.href = '/portal/login';
            }

        }

        if (error.response?.data?.details || error.response?.data?.message) {
            return Promise.reject({
                message: error.response.data.details || error.response.data.message
            });
        }

        return Promise.reject(error);
    }
);

export default client;
