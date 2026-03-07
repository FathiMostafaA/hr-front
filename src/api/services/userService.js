import apiClient from '../apiClient';

const UserService = {
    getAll: async () => {
        const response = await apiClient.get('/Users');
        return response.data;
    },

    create: async (userData) => {
        const response = await apiClient.post('/Users', userData);
        return response.data;
    },

    toggleStatus: async (id) => {
        const response = await apiClient.patch(`/Users/${id}/toggle-status`);
        return response.data;
    },

    assignRole: async (id, role) => {
        const response = await apiClient.post('/Users/assign-role', { userId: id, role });
        return response.data;
    },

    update: async (id, userData) => {
        const response = await apiClient.put(`/Users/${id}`, userData);
        return response.data;
    },

    resetPassword: async (userId, newPassword) => {
        const response = await apiClient.post('/Users/reset-password', { userId, newPassword });
        return response.data;
    },

    search: async (query) => {
        const response = await apiClient.get(`/Users/search?query=${query}`);
        return response.data;
    },
    delete: async (id) => {
        const response = await apiClient.delete(`/Users/${id}`);
        return response.data;
    },

    getPresence: async () => {
        const response = await apiClient.get('/Users/presence');
        return response.data;
    }
};

export default UserService;
