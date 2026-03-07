import apiClient from '../apiClient';

const AnalyticsService = {
    getDashboardStats: async () => {
        const response = await apiClient.get('/Analytics/dashboard');
        return response.data;
    },

    getAttendanceTrends: async () => {
        const response = await apiClient.get('/Analytics/attendance');
        return response.data;
    },

    getPayrollAnalytics: async (year, month) => {
        const response = await apiClient.get(`/Analytics/payroll/${year}/${month}`);
        return response.data;
    },

    getDemographics: async () => {
        const response = await apiClient.get('/Analytics/demographics');
        return response.data;
    },

    getDashboardOverview: async () => {
        const response = await apiClient.get('/Dashboard/stats');
        return response.data;
    },
};

export default AnalyticsService;
