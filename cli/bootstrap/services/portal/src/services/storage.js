/**
 * Auth token
 */
function authCookieExists() {
    if (typeof document === 'undefined') return true;
    return document.cookie.split('; ').some((row) => row.startsWith('GE_AUTH_TOKEN='));
}

function getCookieMaxAge(expiresAt) {
    if (!expiresAt) return 60 * 60;
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function getSecureCookieAttribute() {
    if (typeof window === 'undefined') return '; secure';
    return window.location.protocol === 'https:' ? '; secure' : '';
}

export function getAuthToken() {
    if (typeof window === 'undefined') return null;
    try {
        const authToken = localStorage.getItem('GE_AUTH_TOKEN');

        // The cookie is the expiry check; localStorage can outlive the session.
        if (authToken && !authCookieExists()) {
            removeAuthToken();
            removeAuthUser();
            return null;
        }

        return authToken;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
}

export function setAuthToken({ authToken, expiresAt }) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('GE_AUTH_TOKEN', authToken);
        document.cookie = `GE_AUTH_TOKEN=${authToken}; path=/; samesite=strict; max-age=${getCookieMaxAge(expiresAt)}${getSecureCookieAttribute()}`;
    } catch (error) {
        console.error('Error setting auth token:', error);
    }
}

export function removeAuthToken() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem('GE_AUTH_TOKEN');
        document.cookie = `GE_AUTH_TOKEN=; path=/; max-age=0; samesite=strict${getSecureCookieAttribute()}`;
    } catch (error) {
        console.error('Error removing auth token:', error);
    }
}

/**
 * Auth user
 */
export function getAuthUser() {
    if (typeof window === 'undefined') return null;
    try {
        if (!authCookieExists()) {
            removeAuthUser();
            return null;
        }

        return localStorage.getItem('GE_AUTH_USER');
    } catch (error) {
        console.error('Error getting auth user:', error);
        return null;
    }
}

export function setAuthUser(authUser) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('GE_AUTH_USER', authUser);
    } catch (error) {
        console.error('Error setting auth user:', error);
    }
}

export function removeAuthUser() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem('GE_AUTH_USER');
    } catch (error) {
        console.error('Error removing auth user:', error);
    }
}
