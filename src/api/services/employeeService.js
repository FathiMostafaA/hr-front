import apiClient from '../apiClient';

const EmployeeService = {
    getAll: async () => {
        const response = await apiClient.get('/Employees');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/Employees/${id}`);
        return response.data;
    },

    create: async (employeeData) => {
        const response = await apiClient.post('/Employees', employeeData);
        return response.data;
    },

    update: async (id, employeeData) => {
        const response = await apiClient.put(`/Employees/${id}`, employeeData);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/Employees/${id}`);
        return response.data;
    },

    search: async (term, config = {}) => {
        const response = await apiClient.get('/Employees/search', { params: { term }, ...config });
        return response.data;
    },

    notifyAll: async (message) => {
        const response = await apiClient.post('/Employees/notify-all', message, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },
};

export default EmployeeService;
