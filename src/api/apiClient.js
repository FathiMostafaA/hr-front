import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.eventra.site';
console.log('Using API Base URL:', API_URL);

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

let _accessToken = null;

export const setAccessToken = (token) => {
    _accessToken = token;
};

apiClient.interceptors.request.use(
    (config) => {
        if (_accessToken) {
            config.headers.Authorization = `Bearer ${_accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const { default: toast } = await import('react-hot-toast');

        // Extract and humanize error message
        let errorMessage = 'حدث خطأ غير متوقع';

        const humanizeErrorMessage = (msg) => {
            if (!msg) return errorMessage;

            // Common translations for technical errors
            const translations = {
                'The Email field is required': 'Email is required',
                'The Password field is required': 'Password is required',
                'The FirstName field is required': 'First name is required',
                'The LastName field is required': 'Last name is required',
                'Egyptian National ID must be exactly 14 digits': 'National ID must be exactly 14 digits',
                'The dto field is required': 'Please ensure all required fields are filled correctly',
                'The JSON value could not be converted to System.Nullable`1[System.DateTime]': 'Invalid date format, please check your entry',
                'The JSON value could not be converted': 'Invalid data format, please review your inputs',
                'Path: $.nationalIdExpiry': 'Field: National ID Expiry',
                'Network Error': 'Network connection error, please check your internet',
                'Internal Server Error': 'An internal server error occurred',
                'Bad Request': 'Invalid request, please check the provided data'
            };

            for (const [key, value] of Object.entries(translations)) {
                if (msg.toLowerCase().includes(key.toLowerCase())) return value;
            }

            return msg;
        };

        if (error.response?.data) {
            const data = error.response.data;

            // Handle ASP.NET ValidationProblemDetails
            if (data.errors && typeof data.errors === 'object') {
                const errorMessages = Object.values(data.errors).flat();
                if (errorMessages.length > 0) {
                    errorMessage = errorMessages.map(m => humanizeErrorMessage(m)).join(' | ');
                } else {
                    errorMessage = humanizeErrorMessage(data.title);
                }
            } else {
                errorMessage = humanizeErrorMessage(data.detail || data.title || data.message || (typeof data === 'string' ? data : null));
            }
        } else if (error.message) {
            errorMessage = humanizeErrorMessage(error.message);
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            toast.error('ليس لديك صلاحية للقيام بهذا الإجراء', {
                id: 'forbidden-error',
                duration: 4000,
            });
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized (Token Refresh via Cookie)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const response = await axios.post(`${API_URL}/Auth/refresh`, {}, {
                    withCredentials: true
                });
                const { token } = response.data;
                setAccessToken(token);
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                setAccessToken(null);
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Only show toast for non-401/403 errors (which are handled specifically)
        // and only if it's not a cancelled request
        if (error.response?.status !== 401 && error.response?.status !== 403 && !axios.isCancel(error)) {
            toast.error(errorMessage, {
                id: `api-error-${error.response?.status || 'network'}`,
                duration: 5000
            });
        }

        return Promise.reject(error);
    }
);

export default apiClient;
