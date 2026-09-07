import { commands } from '@gnar-engine/core';

/**
 * Message handlers
 *
 * The queue side of the same commands the http controller reaches. A command
 * name with no service on it resolves against this service.
 */
export const messageHandlers = {

    getNotification: async (payload) => {
        if (!payload.data?.id) {
            throw new Error('No notification id provided');
        }

        const result = await commands.execute('getSingleNotification', {
            id: payload.data.id
        });

        if (!result) {
            throw new Error('Notification not found');
        }

        return { notification: result };
    },

    getManyNotifications: async (payload) => {
        const results = await commands.execute('getManyNotifications', {
            pageSize: payload.data?.pageSize,
            pageNum: payload.data?.pageNum
        });

        return { notifications: results };
    },

    createNotification: async (payload) => {
        const results = await commands.execute('createNotifications', {
            notifications: [payload.data.notification]
        });

        return { notifications: results };
    },

    updateNotification: async (payload) => {
        const { id, ...data } = payload.data;

        const result = await commands.execute('updateNotification', {
            id,
            data
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
