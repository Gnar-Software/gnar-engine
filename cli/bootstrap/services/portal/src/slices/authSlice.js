import { createSlice, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import {
    getAuthToken,
    getAuthUser,
    setAuthToken,
    setAuthUser,
    removeAuthToken,
    removeAuthUser,
} from '../services/storage.js';
import { user } from '../services/user.js';

export const login = createAsyncThunk('auth/login', async ({ username, password }) => {
    return await user.authenticate({ username, password });
});

export const register = createAsyncThunk('auth/register', async (user) => {
    let response;
    try {
        response = await user.createUser(user);
    } catch (error) {
        response = error.response;
    }
    return response;
});

export const logout = createAction('auth/logout');

export const updateProfile = createAsyncThunk('auth/updateProfile', async ({ id, data }, { rejectWithValue }) => {
    try {
        return await user.updateMyProfile({ id, data });
    } catch (err) {
        return rejectWithValue('Something went wrong. Please try again.');
    }
});

export const authSlice = createSlice({
    name: 'auth',
    initialState: {
        authUser: getAuthUser() ? JSON.parse(getAuthUser()) : null,
        accessToken: getAuthToken() ? getAuthToken() : '',
        authLoading: false,
        authError: '',
    },
    reducers: {
        clearAuthError: (state) => {
            state.authError = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state, action) => {
                state.authLoading = true;
                state.authError = '';
            })
            .addCase(login.fulfilled, (state, action) => {
                state.authLoading = false;

                state.authUser = action.payload.user;
                state.accessToken = action.payload.token;

                const tokenExpiresAt = action.payload?.user?.tokenExpiresAt;

                // store auth details
                setAuthToken({ authToken: action.payload.token, expiresAt: tokenExpiresAt });
                setAuthUser(JSON.stringify(action.payload.user));

                // redirect to portal
                window.location.href = '/portal/dashboard';
            })
            .addCase(login.rejected, (state) => {
                state.authLoading = false;
                state.authError = 'Invalid credentials';
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

            // Update profile
            .addCase(updateProfile.fulfilled, (state, action) => {
                if (action.payload?.user) {
                    state.authUser = action.payload.user;
                    setAuthUser(JSON.stringify(action.payload.user));
                }
            })

            // Register
            .addCase(register.pending, (state, action) => {
                state.status = 'loading';
            })
            .addCase(register.fulfilled, (state, action) => {
                state.status = 'idle';

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
    },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice;
