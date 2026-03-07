import apiClient from '../apiClient';

const PayrollService = {
    calculate: async (payrollData) => {
        const response = await apiClient.post('/Payroll/calculate', payrollData);
        return response.data;
    },

    processMonthly: async (year, month) => {
        const response = await apiClient.post(`/Payroll/process-monthly/${year}/${month}`);
        return response.data;
    },

    addComponent: async (componentData) => {
        const response = await apiClient.post('/Payroll/components', componentData);
        return response.data;
    },

    getHistory: async () => {
        const response = await apiClient.get('/Payroll/history');
        return response.data;
    },

    getEmployeeHistory: async (employeeId) => {
        const response = await apiClient.get(`/Payroll/employee/${employeeId}`);
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/Payroll/${id}`);
        return response.data;
    },

    getEmployeeComponents: async (employeeId) => {
        const response = await apiClient.get(`/Payroll/components/employee/${employeeId}`);
        return response.data;
    },

    updateComponent: async (id, componentData) => {
        const response = await apiClient.put(`/Payroll/components/${id}`, componentData);
        return response.data;
    },

    deleteComponent: async (id) => {
        const response = await apiClient.delete(`/Payroll/components/${id}`);
        return response.data;
    }
};

export default PayrollService;
