import apiClient from '../apiClient';

export const holidayService = {
  getAllHolidays: async () => {
    const response = await apiClient.get('/holidays');
    return response.data;
  },

  createHoliday: async (holidayData) => {
    const response = await apiClient.post('/holidays', holidayData);
    return response.data;
  },

  isHoliday: async (date) => {
    const response = await apiClient.get('/holidays/is-holiday', { params: { date } });
    return response.data;
  },

  calculateWorkingDays: async (start, end) => {
    const response = await apiClient.get('/holidays/working-days', { params: { start, end } });
    return response.data;
  }
};
