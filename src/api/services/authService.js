import apiClient from '../apiClient';

const AuthService = {
    login: async (credentials) => {
        const response = await apiClient.post('/Auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('refreshToken', response.data.refreshToken);
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
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    },

    refresh: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await apiClient.post('/Auth/refresh', `"${refreshToken}"`, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },
};

export default AuthService;
