import axios from 'axios';

import { getAuthToken, setAuthToken, removeAuthToken, removeAuthUser } from './storage.js';

// Determine the correct API URL based on the environment
const baseApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost';

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
        const status = error?.response?.status;

        // Log out if 401 or 403
        if (status === 401 || status === 403) {
            removeAuthToken();
            removeAuthUser();

            // Avoid redirect loop if you're already on login
            if (!window.location.pathname.startsWith('/portal/login')) {
                window.location.href = '/portal/login';
            }

            return Promise.reject(error);
        }

        const message = error?.response?.data?.message;
        const details = error?.response?.data?.details;
        if (message || details) {
            return Promise.reject({ message, details });
        }

        return Promise.reject(error);
    }
);

export default client;
