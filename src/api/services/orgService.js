import apiClient from '../apiClient';

const orgService = {
    getOrgChart: async () => {
        const response = await apiClient.get('/Org/chart');
        return response.data;
    }
};

export default orgService;
