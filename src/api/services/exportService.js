import apiClient from '../apiClient';

const exportService = {
    downloadPayrollPdf: async (payrollId) => {
        const response = await apiClient.get(`/exports/payroll/${payrollId}/pdf`, { responseType: 'blob' });
        return response.data; // Blob
    },
    downloadEmployeeExcel: async () => {
        const response = await apiClient.get('/exports/employees/excel', { responseType: 'blob' });
        return response.data; // Blob
    },
    downloadEmployeeCsv: async () => {
        const response = await apiClient.get('/exports/employees/csv', { responseType: 'blob' });
        return response.data; // Blob
    },
    downloadPayrollCsv: async (year, month) => {
        const response = await apiClient.get(`/exports/payroll/${year}/${month}/csv`, { responseType: 'blob' });
        return response.data; // Blob
    },
    downloadLeaveReportCsv: async (from, to) => {
        const response = await apiClient.get('/exports/leaves/csv', { params: { from, to }, responseType: 'blob' });
        return response.data; // Blob
    },
    downloadAttendanceReportCsv: async (from, to) => {
        const response = await apiClient.get('/exports/attendance/csv', { params: { from, to }, responseType: 'blob' });
        return response.data; // Blob
    }
};

export default exportService;
