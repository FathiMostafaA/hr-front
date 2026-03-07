import apiClient from '../apiClient';

const sanctionService = {
    recordViolation: async (violationData) => {
        const response = await apiClient.post('/Sanctions/violation', violationData);
        return response.data;
    },
    getEmployeeViolations: async (employeeId) => {
        const response = await apiClient.get(`/Sanctions/employee/${employeeId}`);
        return response.data;
    },
    applySanction: async (sanctionData) => {
        const response = await apiClient.post('/Sanctions/apply', sanctionData);
        return response.data;
    },
    getAllViolations: async () => {
        const response = await apiClient.get('/Sanctions/all-violations');
        return response.data;
    },
    deleteViolation: async (id) => {
        const response = await apiClient.delete(`/Sanctions/violation/${id}`);
        return response.data;
    },
    deleteSanction: async (id) => {
        const response = await apiClient.delete(`/Sanctions/sanction/${id}`);
        return response.data;
    }
};

export default sanctionService;
