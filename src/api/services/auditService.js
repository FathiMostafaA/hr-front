import apiClient from '../apiClient';

const auditService = {
    getLogs: async (page = 1, pageSize = 50) => {
        const response = await apiClient.get(`/Audit/logs?page=${page}&pageSize=${pageSize}`);
        return response.data;
    },
    getEntityLogs: async (entityName, entityId) => {
        const response = await apiClient.get(`/Audit/entity/${entityName}/${entityId}`);
        return response.data;
    }
};

export default auditService;
