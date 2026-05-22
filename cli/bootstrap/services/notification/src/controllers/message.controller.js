import { commands } from '@gnar-engine/core';

export const messageHandlers = {

    getNotification: async (payload) => {
        let result;
        if (payload.data?.id) {
            result = await commands.execute('getSingleNotification', {
                id: payload.data.id
            });
        } else if (payload.data?.email) {
            result = await commands.execute('getSingleNotification', {
                email: payload.data.email
            });
        } else {
            throw new Error('No notification ID or email provided');
        }
        if (!result) {
            throw new Error('Notification not found');
        }
        return { notification: result };
    },

    getManyNotifications: async (payload) => {
        const results = await commands.execute('getManyNotifications', {});
        return { notifications: results };
    },

    createNotification: async (payload) => {
        const results = await commands.execute('createNotifications', {
            notifications: [payload.data.notification]
        });
        return { notifications: results };
    },

    updateNotification: async (payload) => {
        const result = await commands.execute('updateNotification', {
            id: payload.data.id,
            data: payload.data
        });
        return { notification: result };
    },

    deleteNotification: async (payload) => {
        await commands.execute('deleteNotification', {
            id: payload.data.id
        });
        return { message: 'Notification deleted' };
    },

};
