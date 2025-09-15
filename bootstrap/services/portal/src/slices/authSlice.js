import {createSlice, createAsyncThunk, createAction} from '@reduxjs/toolkit';
import { getAuthToken, getAuthUser, setAuthToken, setAuthUser, removeAuthToken, removeAuthUser } from '@gnar-engine/js-client/src/storage';
import gnarEngine from '@gnar-engine/js-client';


export const login = createAsyncThunk('auth/login', async ({username, password}) => {

    let response;

    try {
        response = await gnarEngine.user.authenticate(username, password);;
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
                state.authLoading = false;
                state.authError = action.payload.data?.error ? action.payload.data.message : '';

                if (action.payload.token) {
                    state.accessToken = action.payload.token;
                    state.authUser = action.payload.user;

                    // store in local storage
                    setAuthToken(action.payload.token);
                    setAuthUser(JSON.stringify(action.payload.user));

                    // redirect to portal
                    window.location.href= '/portal';
                } else {
                    // Handle error case
                    console.error('Login failed:', action.payload);
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
                window.location.href = '/login';
            });
    }
})

export default authSlice;