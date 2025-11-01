// API Configuration - Centralized
const API_CONFIG = {
  // Base URL - can be changed for different environments
  BASE_URL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
  // Socket URL for real-time connections
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
  // API endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/api/auth/staff/login',
      LOGOUT: '/api/auth/staff/logout',
      REGISTER: '/api/auth/staff/register',
      VERIFY_OTP: '/api/auth/staff/verify-otp',
      RESEND_OTP: '/api/auth/staff/resend-otp',
      FORGOT_PASSWORD: '/api/auth/staff/forgot-password',
      RESET_PASSWORD: '/api/auth/staff/reset-password',
      GENERATE_OTP: '/api/auth/generate-otp',
      VERIFY_PASSWORD_OTP: '/api/auth/verify-otp',
      UPDATE_PASSWORD: '/api/auth/update-password'
    },
    
    // Dashboard endpoints
    DASHBOARD: {
      STATS: '/api/dashboard/stats',
      RECENT_PAYMENTS: '/api/dashboard/recent-payments',
      PENDING_PAYMENTS: '/api/dashboard/pending-payments',
      DAILY_PAYMENTS: '/api/dashboard/daily-payments',
      MONTHLY_PAYMENTS: '/api/dashboard/monthly-payments',
      YEARLY_PAYMENTS: '/api/dashboard/yearly-payments',
      AVAILABLE_FILTERS: '/api/dashboard/available-filters'
    },
    
    // WhatsApp endpoints removed
    
    // Auto Messages endpoints removed
    
    // Auto Message Settings endpoints
    AUTO_MESSAGE_SETTINGS: {
      GET_SETTINGS: '/api/auto-message-settings/settings',
      UPDATE_SETTINGS: '/api/auto-message-settings/settings',
      RESET_SETTINGS: '/api/auto-message-settings/settings/reset'
    },
    
    // Student endpoints
    STUDENTS: {
      LIST: '/api/students',
      CREATE: '/api/students',
      UPDATE: (id) => `/api/students/${id}`,
      DELETE: (id) => `/api/students/${id}`,
      GET_BY_ID: (id) => `/api/students/${id}`,
      SEARCH: '/api/students/search',
      BULK_IMPORT: '/api/students/bulk-import',
      EXPORT: '/api/students/export',
      BIRTHDAY: '/api/students/birthday',
      SEND_BIRTHDAY_WISHES: '/api/students/birthday/send-wishes'
    },
    
    // Payment endpoints
    PAYMENTS: {
      LIST: '/api/payments',
      CREATE: '/api/payments',
      UPDATE: (id) => `/api/payments/${id}`,
      DELETE: (id) => `/api/payments/${id}`,
      GET_BY_ID: (id) => `/api/payments/${id}`,
      GET_BY_STUDENT: (studentId) => `/api/payments/student/${studentId}`,
      RECEIPT: (id) => `/api/payments/${id}/receipt`
    },
    
    // Staff endpoints
    STAFF: {
      LIST: '/api/staff',
      CREATE: '/api/staff',
      UPDATE: (id) => `/api/staff/${id}`,
      DELETE: (id) => `/api/staff/${id}`,
      GET_BY_ID: (id) => `/api/staff/${id}`,
      ASSIGN_STUDENTS: '/api/staff/assign-students'
    },
    
    // Course endpoints
    COURSES: {
      LIST: '/api/courses',
      CREATE: '/api/courses',
      UPDATE: (id) => `/api/courses/${id}`,
      DELETE: (id) => `/api/courses/${id}`,
      GET_BY_ID: (id) => `/api/courses/${id}`,
      UPLOAD_IMAGE: '/api/courses/upload-image'
    }
    ,
    // Question Bank endpoints
    QUESTIONS: {
      TEMPLATE: '/api/questions/template',
      IMPORT: '/api/questions/import',
      LIST: (params) => `/api/questions?courseId=${params.courseId}&page=${params.page||1}&limit=${params.limit||20}${params.search?`&search=${encodeURIComponent(params.search)}`:''}`
    }
  }
};

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get Socket URL
export const getSocketUrl = () => {
  return API_CONFIG.SOCKET_URL;
};

// Helper function to get endpoint
export const getEndpoint = (category, key, params = null) => {
  const endpoint = API_CONFIG.ENDPOINTS[category]?.[key];
  if (!endpoint) {
    throw new Error(`Endpoint not found: ${category}.${key}`);
  }
  
  if (typeof endpoint === 'function') {
    return endpoint(params);
  }
  
  return endpoint;
};

// Export the config
export default API_CONFIG;
