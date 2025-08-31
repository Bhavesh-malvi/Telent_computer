// Test script to verify auto logout functionality
console.log('🧪 Testing Auto Logout Configuration...');

// Check environment variables
console.log('Environment Variables:');
console.log('- VITE_ENABLE_AUTO_LOGOUT:', import.meta.env.VITE_ENABLE_AUTO_LOGOUT);
console.log('- VITE_INACTIVITY_TIMEOUT:', import.meta.env.VITE_INACTIVITY_TIMEOUT);
console.log('- PROD:', import.meta.env.PROD);
console.log('- DEV:', import.meta.env.DEV);

// Check localStorage
console.log('LocalStorage:');
console.log('- isLoggedIn:', localStorage.getItem('isLoggedIn'));
console.log('- token:', localStorage.getItem('token') ? 'Present' : 'Not present');

// Check sessionStorage
console.log('SessionStorage:');
console.log('- isActive:', sessionStorage.getItem('isActive'));
console.log('- sessionStart:', sessionStorage.getItem('sessionStart'));

// Simulate auto logout configuration
const INACTIVITY_TIMEOUT = import.meta.env.VITE_INACTIVITY_TIMEOUT 
  ? parseInt(import.meta.env.VITE_INACTIVITY_TIMEOUT) 
  : (import.meta.env.PROD ? 30 * 60 * 1000 : 2 * 60 * 1000);

const ENABLE_AUTO_LOGOUT = import.meta.env.VITE_ENABLE_AUTO_LOGOUT !== 'false';

console.log('Calculated Configuration:');
console.log('- INACTIVITY_TIMEOUT:', INACTIVITY_TIMEOUT, 'ms (', INACTIVITY_TIMEOUT / 1000 / 60, 'minutes)');
console.log('- ENABLE_AUTO_LOGOUT:', ENABLE_AUTO_LOGOUT);

console.log('🧪 Test completed!');
