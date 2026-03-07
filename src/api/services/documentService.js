import apiClient from '../apiClient';

const documentService = {
    getEmployeeDocuments: async (employeeId) => {
        const response = await apiClient.get(`/documents/employee/${employeeId}`);
        return response.data;
    },

    getExpiringDocuments: async (daysAhead = 30) => {
        const response = await apiClient.get('/documents/expiring', { params: { daysAhead } });
        return response.data;
    },

    uploadDocument: async (employeeId, file, documentType, expiryDate, requiresSignature) => {
        const formData = new FormData();
        formData.append('employeeId', employeeId);
        formData.append('documentType', documentType);
        formData.append('requiresSignature', requiresSignature);
        if (expiryDate) formData.append('expiryDate', expiryDate);
        formData.append('file', file);

        const response = await apiClient.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    downloadDocument: async (documentId) => {
        const response = await apiClient.get(`/documents/download/${documentId}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    deleteDocument: async (documentId) => {
        const response = await apiClient.delete(`/documents/${documentId}`);
        return response.data;
    }
};

export default documentService;
