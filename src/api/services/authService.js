import apiClient, { setAccessToken } from '../apiClient';

const AuthService = {
    login: async (credentials) => {
        const response = await apiClient.post('/Auth/login', credentials);
        if (response.data.token) {
            setAccessToken(response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    inviteEmployee: async (employeeId) => {
        const response = await apiClient.post(`/Auth/invite/${employeeId}`);
        return response.data;
    },

    completeActivation: async (activationData) => {
        const response = await apiClient.post('/Auth/complete-activation', activationData);
        return response.data;
    },

    changePassword: async (userId, currentPassword, newPassword) => {
        const response = await apiClient.post('/Auth/change-password', { userId, currentPassword, newPassword });
        return response.data;
    },

    logout: async () => {
        try {
            await apiClient.post('/Auth/logout');
        } finally {
            setAccessToken(null);
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    },

    refresh: async () => {
        const response = await apiClient.post('/Auth/refresh');
        if (response.data.token) {
            setAccessToken(response.data.token);
        }
        return response.data;
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
        // Since token is in memory, we might need a different check or rely on Context
        const user = localStorage.getItem('user');
        return !!user;
    },
};

export default AuthService;
