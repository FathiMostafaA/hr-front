import apiClient from '../apiClient';

const DepartmentService = {
    getAll: async () => {
        const response = await apiClient.get('/Departments');
        return response.data;
    },

    create: async (departmentData) => {
        const response = await apiClient.post('/Departments', departmentData);
        return response.data;
    },

    getHierarchy: async () => {
        const response = await apiClient.get('/Departments/hierarchy');
        return response.data;
    },

    getEmployees: async (id) => {
        const response = await apiClient.get(`/Departments/${id}/employees`);
        return response.data;
    },

    update: async (id, departmentData) => {
        const response = await apiClient.put(`/Departments/${id}`, departmentData);
        return response.data;
    },

    delete: async (id, transferToDepartmentId) => {
        const params = transferToDepartmentId ? `?transferToDepartmentId=${transferToDepartmentId}` : '';
        const response = await apiClient.delete(`/Departments/${id}${params}`);
        return response.data;
    },

    assignManager: async (departmentId, managerId) => {
        const response = await apiClient.post(`/Departments/${departmentId}/assign-manager/${managerId}`);
        return response.data;
    },
};

export default DepartmentService;
