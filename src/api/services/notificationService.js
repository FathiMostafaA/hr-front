import apiClient from '../apiClient';

const notificationService = {
    getNotifications: async (page = 1, pageSize = 20) => {
        const response = await apiClient.get('/Notification', {
            params: { page, pageSize }
        });
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await apiClient.get('/Notification/unread-count');
        return response.data.count;
    },

    markAsRead: async (id) => {
        await apiClient.put(`/Notification/${id}/read`);
    },

    markAllAsRead: async () => {
        await apiClient.put('/Notification/read-all');
    }
};

export default notificationService;
