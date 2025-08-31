import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

export default function StudentLayout() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Global error boundary
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error:', event.error);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [navigate]);

  if (error) {
    return (
      <div className="error-container" style={{
        padding: '20px',
        textAlign: 'center',
        color: '#721c24',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        margin: '20px'
      }}>
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <button 
          onClick={() => {
            setError(null);
            navigate('/student-login', { replace: true });
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Return to Login
        </button>
      </div>
    );
  }

  return <Outlet />;
} 