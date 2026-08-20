import { createSlice, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import { getAuthToken, getAuthUser, setAuthToken, setAuthUser, removeAuthToken, removeAuthUser } from '../services/storage.js';
import { user } from '../services/user.js';


export const login = createAsyncThunk('auth/login', async ({ username, password }) => {
    let response;
    try {
        response = await user.authenticate({ username, password });
    } catch (error) {
        response = error.response;
    }
    return response;
})

export const register = createAsyncThunk('auth/register', async (user) => {
    let response;
    try {
        response = await user.createUser(user);
    } catch (error) {
        response = error.response;
    }
    return response;
})

export const logout = createAction('auth/logout');

export const authSlice = createSlice({
    name: 'auth',
    initialState: {
        authUser: getAuthUser() ? JSON.parse(getAuthUser()) : null,
        accessToken: getAuthToken() ? getAuthToken() : '',
        authLoading: false,
        authError: ''
    },
    reducers: {
    },
    extraReducers: builder => {
        builder
            .addCase(login.pending, (state, action) => {
                state.authLoading = true;
                state.authError = '';
            })
            .addCase(login.fulfilled, (state, action) => {
                console.log('login.fulfilled', action.payload);
                state.authLoading = false;
                state.authError = action.payload.message ? action.payload.message : '';

                if (action.payload.token) {
                    state.accessToken = action.payload.token;
                    state.authUser = action.payload.user;

                    // store in local storage
                    setAuthToken({
                        authToken: action.payload.token,
                        expiresAt: action.payload?.user?.tokenExpiresAt
                    });
                    setAuthUser(JSON.stringify(action.payload.user));

                    // redirect to portal
                    window.location.href= '/portal/dashboard';
                }
            })
            .addCase(logout, (state, action) => {
                // Clear auth state
                state.authUser = '';
                state.accessToken = '';

                // Remove from local storage
                removeAuthToken();
                removeAuthUser();

                // Redirect to login page
                window.location.href = '/portal/login';
            })

            // Register
            .addCase(register.pending, (state, action) => {
                state.status = 'loading';
            })
            .addCase(register.fulfilled, (state, action) => {
                state.status    = 'idle';

                if (action.payload.users && action.payload.users.length > 0) {
                    const user = action.payload.users[0];
            
                    state.logged_in = true;
                    state.user = user;
            
                    // Save user auth details (if needed)
                    setAuthUser(JSON.stringify(user));
            
                    // Redirect to dashboard page
                    window.location.href = '/portal/dashboard';
                } else {
                    state.logged_in = false;
                    state.user = {};
                    state.error = 'Registration failed: Invalid response';
                }
            });
    }
})

export default authSlice;
