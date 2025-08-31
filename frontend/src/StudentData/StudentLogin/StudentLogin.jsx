import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from '../../api/axios';
import './StudentLogin.css';

const StudentLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    studentId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const student = localStorage.getItem('student');
        if (!student) {
          // If there's an error from protected route, show it
          if (location.state?.error) {
            setError(location.state.error);
          }
          setIsCheckingAuth(false);
          return;
        }

        // Verify token is still valid
        const { data } = await axios.get('/auth/profile');
        if (data.student) {
          // Update stored data but keep the token
          const currentData = JSON.parse(student);
          const updatedData = {
            ...data.student,
            token: currentData.token
          };
          localStorage.setItem('student', JSON.stringify(updatedData));
          
          // If we're already logged in and on the login page, redirect to dashboard
          if (location.pathname === '/student-login') {
            navigate('/student-dashboard', { replace: true });
          }
        }
      } catch (err) {
        // If token is invalid, clear storage
        localStorage.removeItem('student');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loginResponse = await axios.post('/auth/login', formData);
      
      if (!loginResponse.data?.student) {
        throw new Error('Invalid response from server');
      }

      // Store student data
      localStorage.setItem('student', JSON.stringify(loginResponse.data.student));
      
      // Set cookie for token
      if (loginResponse.data.student.token) {
        document.cookie = `token=${loginResponse.data.student.token}; path=/; secure; samesite=none`;
      }

      // Verify we can access protected route
      const profileResponse = await axios.get('/auth/profile');
      if (!profileResponse.data?.student) {
        throw new Error('Failed to verify authentication');
      }

      // Get the redirect path from location state, or default to dashboard
      const from = location.state?.from || '/student-dashboard';
      navigate(from, { replace: true });

    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      
      // Clear any existing auth data
      localStorage.removeItem('student');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      if (err.response?.status === 404) {
        setError('Student ID not found');
      } else if (err.response?.status === 401) {
        setError('Invalid credentials');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
      
      setFormData(prev => ({
        ...prev,
        password: ''
      }));
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="student-login-container">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-login-container">
      <Link to="/" className="back-to-home">
        ← Back to Home
      </Link>
      <div className="login-card">
        <div className="login-header">
          <h2>Student Login</h2>
          <p>Welcome back! Please login to your account.</p>
          {location.state?.from && (
            <p style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginTop: '5px' 
            }}>
              You'll be redirected back to your previous page after login.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="studentId">Student ID</label>
            <input
              type="text"
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Enter your Student ID"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;

