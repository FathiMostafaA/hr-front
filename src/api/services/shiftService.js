import apiClient from '../apiClient';

const ShiftService = {
    createType: async (shiftData) => {
        const response = await apiClient.post('/Shifts', shiftData);
        return response.data;
    },

    assign: async (assignmentData) => {
        const response = await apiClient.post('/Shifts/assign', assignmentData);
        return response.data;
    },

    getDailyRoster: async (date) => {
        const response = await apiClient.get('/Shifts/daily', { params: { date } });
        return response.data;
    },
};

export default ShiftService;
