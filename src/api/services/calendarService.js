import apiClient from '../apiClient';

export const calendarService = {
  getEvents: async (year, month) => {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    const response = await apiClient.get('/calendar/events', { params });
    return response.data;
  }
};
