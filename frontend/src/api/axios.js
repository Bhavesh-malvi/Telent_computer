import axios from 'axios';

const instance = axios.create({
    // baseURL: 'http://localhost:5000/api',
    baseURL: 'https://telent-computer.onrender.com/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        // Get stored student data
        const student = localStorage.getItem('student');
        if (student) {
            try {
                const { token } = JSON.parse(student);
                if (token) {
                    // Set both cookie and Authorization header for maximum compatibility
                    config.headers.Authorization = `Bearer ${token}`;
                    // Only set secure cookie in production
                    const isProduction = window.location.protocol === 'https:';
                    document.cookie = `token=${token}; path=/; ${isProduction ? 'secure; samesite=none' : ''}`;
                }
            } catch (error) {
                console.error('Error parsing student data:', error);
                // If there's an error, clear the invalid data
                localStorage.removeItem('student');
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
instance.interceptors.response.use(
    (response) => {
        // If we get a new token in the response, update it
        if (response.data?.student?.token) {
            const student = JSON.parse(localStorage.getItem('student') || '{}');
            student.token = response.data.student.token;
            localStorage.setItem('student', JSON.stringify(student));
            // Only set secure cookie in production
            const isProduction = window.location.protocol === 'https:';
            document.cookie = `token=${response.data.student.token}; path=/; ${isProduction ? 'secure; samesite=none' : ''}`;
        }
        return response;
    },
    (error) => {
        console.error('API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            config: error.config
        });

        // Handle authentication errors
        if (error.response?.status === 401) {
            // Clear both token storage methods
            localStorage.removeItem('student');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            
            // Only redirect if not already on login page to avoid loops
            if (!window.location.pathname.includes('login')) {
                window.location.href = '/student-login';
            }
        }
        return Promise.reject(error);
    }
);

export default instance; 