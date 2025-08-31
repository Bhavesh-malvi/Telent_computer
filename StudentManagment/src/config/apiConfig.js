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
    
    // WhatsApp endpoints
    WHATSAPP: {
      INITIALIZE: '/api/whatsapp/initialize',
      STATUS: '/api/whatsapp/status',
      SEND_REMINDERS: '/api/whatsapp/send-reminders',
      TEST_REMINDERS: '/api/whatsapp/test-reminders',
      TEST_AUTOMATIC_REMINDERS: '/api/whatsapp/test-automatic-reminders',
      DISCONNECT: '/api/whatsapp/disconnect',
      FORCE_DISCONNECT: '/api/whatsapp/force-disconnect',
      FORCE_NEW_QR: '/api/whatsapp/initialize',
      GET_REMINDER_SETTINGS: '/api/whatsapp/reminder-settings',
      UPDATE_REMINDER_SETTINGS: '/api/whatsapp/reminder-settings',
      BIRTHDAY_WISHES_STATUS: '/api/whatsapp/birthday-wishes-status',
      TEST_BIRTHDAY_WISHES: '/api/whatsapp/test-birthday-wishes'
    },
    
    // Auto Messages endpoints (new system)
    AUTO_MESSAGES: {
      WHATSAPP_INITIALIZE: '/api/auto-messages/whatsapp/initialize',
      WHATSAPP_STATUS: '/api/auto-messages/whatsapp/status',
      WHATSAPP_QR_CODE: '/api/auto-messages/whatsapp/qr-code',
      WHATSAPP_DISCONNECT: '/api/auto-messages/whatsapp/disconnect',
      FEE_REMINDERS_SEND: '/api/auto-messages/fee-reminders/send',
      FEE_REMINDERS_STATUS: '/api/auto-messages/fee-reminders/status',
      BIRTHDAY_WISHES_SEND: '/api/auto-messages/birthday-wishes/send',
      BIRTHDAY_WISHES_STATUS: '/api/auto-messages/birthday-wishes/status',
      ADMISSION_CONFIRMATIONS_SEND: '/api/auto-messages/admission-confirmations/send',
      ADMISSION_CONFIRMATIONS_STATUS: '/api/auto-messages/admission-confirmations/status',
      FEE_PAYMENT_SEND: '/api/auto-messages/fee-payment/send',
      FEE_PAYMENT_STATUS: '/api/auto-messages/fee-payment/status',
      ALL_SERVICES_STATUS: '/api/auto-messages/status',
      TEST_MESSAGE: '/api/auto-messages/test-message'
    },
    
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
