import apiClient from '../apiClient';

const AttendanceService = {
    clockIn: async (clockInData) => {
        const response = await apiClient.post('/Attendance/clock-in', clockInData);
        return response.data;
    },

    clockOut: async (clockOutData) => {
        const response = await apiClient.post('/Attendance/clock-out', clockOutData);
        return response.data;
    },

    getHistory: async (employeeId, from, to) => {
        const response = await apiClient.get(`/Attendance/employee/${employeeId}`, {
            params: { from, to }
        });
        return response.data;
    },

    getTodayAttendance: async (employeeId) => {
        const response = await apiClient.get(`/Attendance/today/${employeeId}`);
        return response.data;
    },

    getAll: async (from, to) => {
        const response = await apiClient.get('/Attendance/all', {
            params: { from, to }
        });
        return response.data;
    },
};

export default AttendanceService;

