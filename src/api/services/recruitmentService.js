import apiClient from '../apiClient';

const RecruitmentService = {
    postJob: async (jobData) => {
        const response = await apiClient.post('/Recruitment/jobs', jobData);
        return response.data;
    },

    apply: async (applicationData) => {
        const response = await apiClient.post('/Recruitment/apply', applicationData);
        return response.data;
    },

    updateCandidateStage: async (id, stageData) => {
        const response = await apiClient.put(`/Recruitment/candidates/${id}/stage`, stageData);
        return response.data;
    },

    updateJobStatus: async (id, status) => {
        const response = await apiClient.put(`/Recruitment/jobs/${id}/status`, `"${status}"`, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    getJobs: async (status) => {
        const response = await apiClient.get('/Recruitment/jobs', { params: { status } });
        return response.data;
    },

    getCandidates: async (jobId) => {
        const response = await apiClient.get(`/Recruitment/jobs/${jobId}/candidates`);
        return response.data;
    },

    hireCandidate: async (id, hireData) => {
        const response = await apiClient.post(`/Recruitment/candidates/${id}/hire`, hireData);
        return response.data;
    }
};

export default RecruitmentService;
