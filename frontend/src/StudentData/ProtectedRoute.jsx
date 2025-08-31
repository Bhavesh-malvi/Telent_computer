import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';

export default function ProtectedRoute({ children }) {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    error: null
  });
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    
    const verifyAuth = async () => {
      try {
        const storedStudent = localStorage.getItem('student');
        if (!storedStudent) {
          if (isMounted) {
            setAuthState({ isLoading: false, isAuthenticated: false, error: null });
          }
          return;
        }

        // Parse stored data to get token
        const parsedStoredStudent = JSON.parse(storedStudent);
        const token = parsedStoredStudent.token;

        // Verify token with backend
        const { data } = await axios.get('/auth/profile');
        
        if (!data || !data.student) {
          throw new Error('Invalid profile data received');
        }

        // Combine fresh data with token
        const updatedStudent = {
          ...data.student,
          token // Preserve the token
        };

        // Update student state with combined data
        if (isMounted) {
          setAuthState({ isLoading: false, isAuthenticated: true, error: null });
        }
        
        // Update localStorage with latest data
        localStorage.setItem('student', JSON.stringify(updatedStudent));

      } catch (err) {
        console.error('Auth verification failed:', err);
        
        // Clear invalid data
        localStorage.removeItem('student');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        if (isMounted) {
          setAuthState({ 
            isLoading: false, 
            isAuthenticated: false, 
            error: err.response?.data?.message || err.message || 'Authentication failed'
          });
        }
      }
    };

    // Only verify if we're not already on the login page
    if (location.pathname !== '/student-login') {
      verifyAuth();
    } else {
      setAuthState({ isLoading: false, isAuthenticated: false, error: null });
    }

    return () => {
      isMounted = false;
    };
  }, [location.pathname]); // Re-verify when path changes

  if (authState.isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div>Verifying authentication...</div>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    // Don't redirect if we're already on the login page
    if (location.pathname === '/student-login') {
      return children;
    }

    // Save the attempted URL and any error message
    return (
      <Navigate 
        to="/student-login" 
        state={{ 
          from: location.pathname,
          error: authState.error 
        }} 
        replace 
      />
    );
  }

  // Don't allow access to login page if already authenticated
  if (location.pathname === '/student-login') {
    return <Navigate to="/student-dashboard" replace />;
  }

  return children;
} 