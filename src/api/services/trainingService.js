import apiClient from '../apiClient';

const trainingService = {
    getCourses: async () => {
        const response = await apiClient.get('/Training/courses');
        return response.data;
    },
    createCourse: async (courseData) => {
        const response = await apiClient.post('/Training/courses', courseData);
        return response.data;
    },
    enrollEmployee: async (courseId, employeeId) => {
        const response = await apiClient.post(`/Training/enroll?courseId=${courseId}&employeeId=${employeeId}`);
        return response.data;
    },
    getEmployeeEnrollments: async (employeeId) => {
        const response = await apiClient.get(`/Training/employee/${employeeId}`);
        return response.data;
    },
    updateEnrollment: async (enrollmentId, updateData) => {
        const response = await apiClient.patch(`/Training/enrollment/${enrollmentId}`, updateData);
        return response.data;
    },
    deleteCourse: async (id) => {
        const response = await apiClient.delete(`/Training/courses/${id}`);
        return response.data;
    }
};

export default trainingService;
