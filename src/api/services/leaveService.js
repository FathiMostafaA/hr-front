import apiClient from '../apiClient';

const LeaveService = {
    request: async (leaveData) => {
        const response = await apiClient.post('/Leaves/request', leaveData);
        return response.data;
    },

    approve: async (id, comment) => {
        const response = await apiClient.put(`/Leaves/${id}/approve`, JSON.stringify(comment || ''), {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    reject: async (id, comment) => {
        const response = await apiClient.put(`/Leaves/${id}/reject`, JSON.stringify(comment || ''), {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    getHistory: async (employeeId) => {
        const response = await apiClient.get(`/Leaves/employee/${employeeId}`);
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/Leaves/${id}`);
        return response.data;
    },

    getBalance: async (employeeId, type, year) => {
        const response = await apiClient.get(`/Leaves/balance/${employeeId}/${type}/${year}`);
        return response.data;
    },

    getPending: async () => {
        const response = await apiClient.get('/Leaves/pending');
        return response.data;
    },

    initializeBalance: async (data) => {
        const response = await apiClient.post('/Leaves/balance/initialize', data);
        return response.data;
    },
};

export default LeaveService;
