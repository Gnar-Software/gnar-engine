// Auth token
export function getAuthToken() {
    try {
        return localStorage.getItem('GE_AUTH_TOKEN');
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
}

export function setAuthToken(authToken) {
    try {
        localStorage.setItem('GE_AUTH_TOKEN', authToken);
    } catch (error) {
        console.error('Error setting auth token:', error);
        return null;
    }
}

export function removeAuthToken() {
    try {
        localStorage.removeItem('GE_AUTH_TOKEN');
    } catch (error) {
        console.error('Error removing auth token:', error);
        return null;
    }
}

// Auth user
export function getAuthUser() {
    try {
        return localStorage.getItem('GE_AUTH_USER');
    } catch (error) {
        console.error('Error getting auth user:', error);
        return null;
    }
}

export function setAuthUser(authUser) {
    try {
        localStorage.setItem('GE_AUTH_USER', authUser);
    } catch (error) {
        console.error('Error setting auth user:', error);
        return null;
    }
}

export function removeAuthUser() {
    try {
        localStorage.removeItem('GE_AUTH_USER');
    } catch (error) {
        console.error('Error removing auth user:', error);
        return null;
    }
}