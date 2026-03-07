import apiClient from '../apiClient';

const reportService = {
    getEmployeeSummary: async () => {
        const response = await apiClient.get('/reports/employees');
        return response.data;
    },
    getLeaveReport: async (from, to) => {
        const response = await apiClient.get('/reports/leaves', { params: { from, to } });
        return response.data;
    },
    getPayrollSummary: async (year, month) => {
        const response = await apiClient.get(`/reports/payroll/${year}/${month}`);
        return response.data;
    }
};

export default reportService;
