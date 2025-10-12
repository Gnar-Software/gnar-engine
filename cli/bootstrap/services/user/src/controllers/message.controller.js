import { commands } from '@gnar-engine/core';


export const messageHandlers = {

    getAuthenticatedUser: async (payload) => {
        console.log('getAuthenticatedUser payload:', payload);
        const user = await commands.execute('getAuthenticatedUser', {
            token: payload.data.token
        });

        return { user };
    },

    createUnauthenticatedSessionToken: async (payload) => {
        const unauthenticatedSessionToken = await commands.execute('createUnauthenticatedSessionToken');
    
        return { unauthenticatedSessionToken };
    },

    createUserWithRandomPassword: async (payload) => {
        const user = await commands.execute('createUserWithRandomPassword', {
            user: payload.data.user
        });

        return { user };
    },

    getUser: async (payload) => {
        let user;

        if (payload.data?.id) {
            user = await commands.execute('getSingleUser', {
                id: payload.data.id
            });
        } else if (payload.data?.email) {
            user = await commands.execute('getSingleUser', {
                email: payload.data.email
            });
        } else {
            throw new Error('No user ID or email provided');
        }

        if (!user) {
            throw new Error('User not found');
        }

        return { user };
    },

};
