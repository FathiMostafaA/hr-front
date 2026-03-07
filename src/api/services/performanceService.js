import apiClient from '../apiClient';

const PerformanceService = {
    createCycle: async (cycleData) => {
        const response = await apiClient.post('/Performance', cycleData);
        return response.data;
    },

    updateReview: async (id, reviewData) => {
        const response = await apiClient.put(`/Performance/${id}`, reviewData);
        return response.data;
    },

    acknowledge: async (id) => {
        const response = await apiClient.put(`/Performance/${id}/acknowledge`);
        return response.data;
    },

    getAllReviews: async () => {
        const response = await apiClient.get('/Performance/all');
        return response.data;
    },

    getEmployeeHistory: async (employeeId) => {
        const response = await apiClient.get(`/Performance/employee/${employeeId}`);
        return response.data;
    },

    getPendingReviews: async (managerId) => {
        const response = await apiClient.get(`/Performance/pending/${managerId}`);
        return response.data;
    }
};

export default PerformanceService;
