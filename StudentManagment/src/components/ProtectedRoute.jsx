import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const ProtectedRoute = ({ children, allow = 'Any' }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    const validateToken = async () => {
      if (!isLoggedIn || !token) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        // Check if token is valid by making a simple API call
        console.log('Validating token...', { isLoggedIn, hasToken: !!token });
        await api.get('/auth/validate-token');
        console.log('Token validation successful');
        setIsValid(true);
      } catch (error) {
        console.log('Token validation failed:', error.message);
        
        // Show toast notification
        if (error.response?.status === 401 || error.response?.status === 403) {
          toast.error('Session expired. Please login again.');
        }
        
        // Clear local storage instead of calling performLogout to avoid redirect loop
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('scopeCategory');
        localStorage.removeItem('staffId');
        localStorage.removeItem('username');
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [isLoggedIn, token]);

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not logged in or token is invalid
  if (!isLoggedIn || !isValid) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  const role = localStorage.getItem('role') || 'SuperAdmin';
  if (allow === 'Any') return children;

  const allowedRoles = Array.isArray(allow) ? allow : [allow];
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute; 