import apiClient from '../apiClient';

const feedService = {
    getFeed: async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/Feed?page=${page}&pageSize=${pageSize}`);
        return response.data;
    },

    createPost: async (content) => {
        const response = await apiClient.post('/Feed', { content });
        return response.data;
    },

    addComment: async (postId, content) => {
        const response = await apiClient.post(`/Feed/${postId}/comments`, { content });
        return response.data;
    },

    toggleLike: async (postId) => {
        const response = await apiClient.post(`/Feed/${postId}/like`);
        return response.data;
    },

    deletePost: async (postId) => {
        await apiClient.delete(`/Feed/${postId}`);
    },

    updatePost: async (postId, content) => {
        const response = await apiClient.put(`/Feed/${postId}`, { content });
        return response.data;
    }
};

export default feedService;
