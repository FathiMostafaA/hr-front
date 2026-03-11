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

    cancel: async (id) => {
        const response = await apiClient.put(`/Leaves/${id}/cancel`);
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

    getSummaryForEmployee: async (employeeId, year) => {
        const response = await apiClient.get(`/Leaves/balance/me/${year}`);
        return response.data;
    },

    getPending: async () => {
        const response = await apiClient.get('/Leaves/pending');
        return response.data;
    },

    getMyPending: async () => {
        const response = await apiClient.get('/Leaves/pending/me');
        return response.data;
    },

    initializeBalance: async (data) => {
        const response = await apiClient.post('/Leaves/balance/initialize', data);
        return response.data;
    },

    getLeaveTypes: async () => {
        const response = await apiClient.get('/Leaves/types');
        return response.data;
    },

    // --- New Endpoints for HR/Admin ---

    getAll: async (filterParams) => {
        const response = await apiClient.get('/Leaves', { params: filterParams });
        return response.data; // Expected to return a PagedResult
    },

    hrCancel: async (id, reason) => {
        const response = await apiClient.put(`/Leaves/${id}/hr-cancel`, JSON.stringify(reason || ''), {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    getLeaveBalanceSummary: async (year) => {
        const response = await apiClient.get(`/Leaves/balance/summary/${year}`);
        return response.data;
    },

    bulkInitializeBalances: async (data) => {
        // data: { year: int, defaultEntitledDays: int, employeeIds?: [Guid] }
        const response = await apiClient.post('/Leaves/balance/bulk-initialize', data);
        return response.data;
    },

    carryForwardBalances: async (data) => {
        // data: { fromYear: int, toYear: int, employeeIds?: [Guid] }
        const response = await apiClient.post('/Leaves/balance/carry-forward', data);
        return response.data;
    },
};

export default LeaveService;
