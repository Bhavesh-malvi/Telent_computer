import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/Login.css';
import api, { setLoginStatus } from '../services/api';


const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Staff-based login (including SuperAdmin) via backend authentication
      console.log('Attempting staff login with:', { userId: id });
      
      const { data } = await api.post('/auth/staff/login', { userId: id, password });
      // Don't log sensitive data in production
      if (import.meta.env.DEV) {
        console.log('Staff login response received');
      }
      
      if (!data || !data.staff) {
        throw new Error('Invalid response from server');
      }
      
      const staff = data.staff;
      const role = data.role || staff?.role || '';
      let scopeCategory = 'All';
      if (/basic/i.test(role)) scopeCategory = 'Basic';
      else if (/\bit\b/i.test(role)) scopeCategory = 'IT';

      // Store user data in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('role', role);
      localStorage.setItem('scopeCategory', scopeCategory);
      localStorage.setItem('staffId', staff?._id || '');
      
      // For SuperAdmin, use registered username, for others use full name
      let displayName;
      if (role === 'SuperAdmin') {
        displayName = staff?.username || 'SuperAdmin';
      } else {
        displayName = [staff?.firstName, staff?.lastName].filter(Boolean).join(' ') || staff?.username || '';
      }
      
      if (displayName) localStorage.setItem('username', displayName);
      localStorage.setItem('lastLoginAt', new Date().toISOString());
      if (data?.token) localStorage.setItem('token', data.token);
      
      // Don't log sensitive data in production
      if (import.meta.env.DEV) {
        console.log('Login successful for role:', role);
        console.log('Token stored:', !!data?.token);
        console.log('LocalStorage items:', {
          isLoggedIn: localStorage.getItem('isLoggedIn'),
          token: !!localStorage.getItem('token'),
          role: localStorage.getItem('role')
        });
      }
      
      // Initialize auto-logout monitoring
      await setLoginStatus(true);
      
      // Navigate to dashboard
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      
      // Better error handling with more specific messages
      if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection.');
      } else if (err.message === 'Invalid response from server') {
        setError('Server response error. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }
      
      // Clear any partial data that might have been set
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('role');
      localStorage.removeItem('scopeCategory');
      localStorage.removeItem('staffId');
      localStorage.removeItem('username');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Login</h2>
        <div className="login-field">
          <label htmlFor="id">Username</label>
          <input
            type="text"
            id="id"
            value={id}
            onChange={e => setId(e.target.value)}
            autoComplete="username"
            required
            placeholder="Enter Username"
          />
        </div>
        <div className="login-field">
          <label htmlFor="password">Password</label>
          <div className="relative" style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Enter Password"
              className="w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>
        </div>
        {error && <div className="login-error">{error}</div>}
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login; 