import axios from "axios";

import API_CONFIG from '../config/apiConfig.js';

const API_URL = `${API_CONFIG.BASE_URL}/api`;
// const API_URL = 'https://telent-computer-uykj.vercel.app/api';

// Auto logout configuration (increased for production)
const INACTIVITY_TIMEOUT = import.meta.env.VITE_INACTIVITY_TIMEOUT 
  ? parseInt(import.meta.env.VITE_INACTIVITY_TIMEOUT) 
  : (import.meta.env.PROD ? 30 * 60 * 1000 : 2 * 60 * 1000); // 30 min in production, 2 min in dev

// Enable auto logout based on environment variable
const ENABLE_AUTO_LOGOUT = import.meta.env.VITE_ENABLE_AUTO_LOGOUT !== 'false';

console.log('🔧 Auto Logout Config:', {
  isProduction: import.meta.env.PROD,
  inactivityTimeout: INACTIVITY_TIMEOUT,
  enableAutoLogout: ENABLE_AUTO_LOGOUT,
  envTimeout: import.meta.env.VITE_INACTIVITY_TIMEOUT
});

let inactivityTimer = null;
let isLoggedIn = false;

// Logout utility function
export const performLogout = async () => {
  
  // Try to call backend logout to clear staff presence
  try {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/auth/staff/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  } catch {
    // Backend logout failed, continue with local cleanup
  }
  
  // Clear all stored data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('theme'); // Clean theme data
  sessionStorage.removeItem('isActive');
  sessionStorage.removeItem('sessionStart');
  
  // Clear timer
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  
  // Set logged out state
  isLoggedIn = false;
  
  // Redirect to login page
  window.location.href = '/login';
};

// Start inactivity timer
const startInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  console.log(`🔧 Starting inactivity timer for ${INACTIVITY_TIMEOUT / 1000 / 60} minutes`);
  
  inactivityTimer = setTimeout(async () => {
    if (isLoggedIn) {
      console.log('🔧 Inactivity timeout reached, performing logout...');
      await performLogout();
    }
  }, INACTIVITY_TIMEOUT);
};

// Reset inactivity timer on user activity
const resetInactivityTimer = () => {
  if (isLoggedIn) {
    startInactivityTimer();
    // Mark user as active in session
    sessionStorage.setItem('isActive', 'true');
    console.log('🔧 User activity detected, timer reset');
  }
};

// Track user activity events
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

// Initialize activity monitoring
export const initializeActivityMonitoring = async () => {
  
  // Check if auto logout is enabled
  if (!ENABLE_AUTO_LOGOUT) {
    console.log('🔧 Auto logout is disabled by environment variable');
    return;
  }
  
  // Check if user is logged in
  const token = localStorage.getItem('token');
  const isLoggedInStatus = localStorage.getItem('isLoggedIn');
  
  if (token && isLoggedInStatus === 'true') {
    isLoggedIn = true;
    
    console.log('🔧 Initializing auto logout monitoring...');
    
    // Start timer
    startInactivityTimer();
    
    // Add activity event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Check for session storage on page load (browser close detection)
    const wasActive = sessionStorage.getItem('isActive');
    const sessionStart = sessionStorage.getItem('sessionStart');
    const currentTime = Date.now();
    
    
    // If user was active (page refresh), don't logout
    if (wasActive === 'true') {
      // Mark as active again
      sessionStorage.setItem('isActive', 'true');
    } else if (sessionStart) {
      // User was not active but session start exists
      const timeGap = currentTime - parseInt(sessionStart);
      
      if (timeGap > 5000) {
        // Browser was closed for more than 5 seconds - auto logout
        await performLogout();
        return;
      } else {
        // It's just a page refresh (less than 5 seconds) - don't logout
        sessionStorage.setItem('isActive', 'true');
      }
    } else {      // Mark as active and set session start time
      sessionStorage.setItem('isActive', 'true');
      sessionStorage.setItem('sessionStart', currentTime.toString());
    }
    
    // Handle browser close vs page refresh using visibilitychange
    // eslint-disable-next-line no-unused-vars
    let isPageHidden = false;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isPageHidden = true;
        // Set a flag to track if page was hidden
        sessionStorage.setItem('pageHidden', 'true');
      } else {
        isPageHidden = false;
        // Remove the flag when page becomes visible
        sessionStorage.removeItem('pageHidden');
      }
    });
    
    // Check if page was hidden (browser close) vs just refresh
    const pageWasHidden = sessionStorage.getItem('pageHidden');
    if (pageWasHidden === 'true') {
      sessionStorage.removeItem('pageHidden');
      // Mark as inactive for browser close detection
      sessionStorage.removeItem('isActive');
    }
  }
};

// Stop activity monitoring
export const stopActivityMonitoring = () => {
  isLoggedIn = false;
  
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  
  // Remove activity event listeners
  activityEvents.forEach(event => {
    document.removeEventListener(event, resetInactivityTimer, true);
  });
  
  sessionStorage.removeItem('isActive');
  sessionStorage.removeItem('sessionStart');
};

// Set login status
export const setLoginStatus = async (status) => {
  isLoggedIn = status;
  if (status) {
    await initializeActivityMonitoring();
  } else {
    stopActivityMonitoring();
  }
};

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  }
});

// Add request interceptor to handle FormData and Authorization token
api.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }
  const token = localStorage.getItem('token');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers
    });
    
    // Auto logout on authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // performLogout(); // Temporarily disabled for debugging
    }
    
    return Promise.reject(error);
  }
);

// Issue related API calls
export const createIssue = async (studentId, description) => {
  try {
    const response = await api.post('/issues', {
      studentId,
      description
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getStudentIssues = async (studentId) => {
  try {
    const response = await api.get(`/issues/student/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllIssues = async () => {
  try {
    const response = await api.get('/issues');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCourseById = async (courseId) => {
  try {
    const response = await api.get(`/addcourses/${courseId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getChaptersByCourse = (courseId) => api.get(`/chapters/${courseId}`);
export const addChapter = (courseId, data) => api.post(`/chapters/${courseId}`, data);
export const editChapter = (chapterId, data) => api.put(`/chapters/edit/${chapterId}`, data);
export const deleteChapter = (chapterId) => api.delete(`/chapters/delete/${chapterId}`);

export const addTopicToChapter = async (chapterId, topicData) => {
  // topicData should be FormData with 'name' and 'pdf'
  return api.post(`/chapters/add-topic/${chapterId}`, topicData);
};

export const editTopicInChapter = (chapterId, topicIdx, data) => api.put(`/chapters/edit-topic/${chapterId}/${topicIdx}`, data);
export const deleteTopicFromChapter = (chapterId, topicIdx) => api.delete(`/chapters/delete-topic/${chapterId}/${topicIdx}`);

export const getStudentCourseById = async (courseId) => {
  try {
    const response = await api.get(`/studentcourses/${courseId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const payStudentFee = async (studentId, amount, method, utrNumber, chequeDetails, collectedBy, paymentDate) => {
  const data = { amount, method, utrNumber };
  if (chequeDetails) {
    data.chequeDetails = chequeDetails;
  }
  if (collectedBy) {
    data.collectedBy = collectedBy;
  }
  if (paymentDate) {
    data.paymentDate = paymentDate;
  }
  return api.post(`/students/${studentId}/pay`, data);
};

export const updateChequeStatus = async (studentId, paymentId, status) => {
  return api.patch(`/students/${studentId}/payment/${paymentId}/cheque-status`, { status });
};

// Staff
export const createStaff = async ({ firstName, lastName, username, email, password, role, profileImage }) => {
  const form = new FormData();
  form.append('firstName', firstName);
  form.append('lastName', lastName);
  form.append('username', username);
  form.append('email', email);
  form.append('password', password);
  form.append('role', role);
  if (profileImage) form.append('profileImage', profileImage);
  const { data } = await api.post('/staff', form);
  return data;
};

export const getStaff = async () => {
  const { data } = await api.get('/staff');
  return data;
};

export const updateStaff = async (id, { firstName, lastName, username, email, password, role, profileImage }) => {
  const form = new FormData();
  if (firstName) form.append('firstName', firstName);
  if (lastName) form.append('lastName', lastName);
  if (username) form.append('username', username);
  if (email) form.append('email', email);
  if (password) form.append('password', password);
  if (role) form.append('role', role);
  if (profileImage) form.append('profileImage', profileImage);
  const { data } = await api.put(`/staff/${id}`, form);
  return data;
};

export const deleteStaff = async (id) => {
  const { data } = await api.delete(`/staff/${id}`);
  return data;
};

export default api; 