import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { io as ioClient } from 'socket.io-client';
import { User, Mail, Lock, Upload, UserCheck, Save, Edit, Trash2, Plus, X } from 'lucide-react';
import { createStaff, getStaff, updateStaff as updateStaffApi, deleteStaff as deleteStaffApi } from '../services/api';
import api from '../services/api';
import API_CONFIG from '../config/apiConfig.js';
import Avatar from '../components/Avatar';


function AssignStaff() {
  const [formData, setFormData] = useState({
    profileImage: null,
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    role: ''
  });

  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await getStaff();
      setStaffList(Array.isArray(data) ? data : []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadStaff();
    // Start heartbeat to mark current staff online
    const interval = setInterval(() => {
      try {
        api.post('/staff/heartbeat').catch(() => {});
      } catch {}
    }, 15000); // every 15s - more frequent heartbeat
    // Realtime presence via socket.io
    const socket = ioClient(API_CONFIG.SOCKET_URL);
    socket.on('connect', () => {});
    socket.on('staff:presence', (payload) => {
      // Optimistically update list if id matches
      setStaffList(prev => prev.map(s => (String(s._id) === String(payload.id) ? { ...s, lastActiveAt: payload.lastActiveAt ?? s.lastActiveAt, lastLoginAt: payload.lastLoginAt ?? s.lastLoginAt } : s)));
    });

    // Poll staff list for consistency in case any events missed
    const refresh = () => { try { loadStaff(); } catch {} };
    const refreshInterval = setInterval(refresh, 15000);
    // Refresh when tab becomes active
    const onVisibility = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisibility);
    
    // Send heartbeat on user activity (mouse move, click, keypress)
    const sendHeartbeat = () => {
      try {
        api.post('/staff/heartbeat').catch(() => {});
        // Debug: Log heartbeat sent
        if (import.meta.env.DEV) {
          console.log('💓 Heartbeat sent at:', new Date().toLocaleTimeString());
        }
      } catch {}
    };
    
    // Throttled heartbeat on user activity
    let heartbeatTimeout;
    const throttledHeartbeat = () => {
      clearTimeout(heartbeatTimeout);
      heartbeatTimeout = setTimeout(sendHeartbeat, 5000); // Send heartbeat 5 seconds after last activity
    };
    
    document.addEventListener('mousemove', throttledHeartbeat);
    document.addEventListener('click', throttledHeartbeat);
    document.addEventListener('keypress', throttledHeartbeat);
    
    // Initial quick refresh
    setTimeout(refresh, 1500);
    return () => {
      clearInterval(interval);
      clearInterval(refreshInterval);
      clearTimeout(heartbeatTimeout);
      try { socket.close(); } catch {}
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('mousemove', throttledHeartbeat);
      document.removeEventListener('click', throttledHeartbeat);
      document.removeEventListener('keypress', throttledHeartbeat);
    };
  }, []);

  // Auto-hide success banner after 3 seconds
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const getCurrentStaffId = () => {
    try {
      const saved = localStorage.getItem('staffId');
      if (saved) return saved;
      const token = localStorage.getItem('token');
      if (!token) return '';
      const [, payloadB64] = token.split('.');
      if (!payloadB64) return '';
      const payloadJson = JSON.parse(atob(payloadB64));
      if (payloadJson && payloadJson.type === 'staff' && payloadJson.id) {
        return String(payloadJson.id);
      }
      return '';
    } catch {
      return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    // Password rules:
    // - Create: required, >= 6
    // - Edit: optional; if provided, must be >= 6
    if (!editingId) {
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      }
    } else if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');
    
    if (!validateForm()) {
      toast.error('Please fix the highlighted errors');
      return false;
    }
    
    try {
      setSubmitting(true);
      if (editingId) {
        await updateStaffApi(editingId, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password || undefined,
          role: formData.role,
          profileImage: formData.profileImage,
        });
        setSuccessMsg('Staff updated successfully');
        toast.success('Staff updated successfully');
      } else {
        await createStaff({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          profileImage: formData.profileImage,
        });
        setSuccessMsg('Staff created successfully');
        toast.success('Staff created successfully');
      }
      setFormData({ profileImage: null, firstName: '', lastName: '', username: '', password: '', email: '', role: '' });
      setImagePreview('');
      setEditingId(null);
      await loadStaff();
      return true;
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data || {};
      let message = data?.message || err?.message || 'Failed to save staff';
      // Detect duplicate field more precisely (Mongo duplicate or custom 409)
      let duplicateField = null;
      if (status === 409) {
        if (/username/i.test(message) || data?.field === 'username' || data?.keyPattern?.username) {
          duplicateField = 'username';
        } else if (/email/i.test(message) || data?.field === 'email' || data?.keyPattern?.email) {
          duplicateField = 'email';
        } else if (/duplicate key/i.test(message)) {
          if (/username/i.test(message)) duplicateField = 'username';
          if (/email/i.test(message)) duplicateField = 'email';
        }
      }
      if (duplicateField === 'username') {
        message = 'Username already exists';
        setErrors(prev => ({ ...prev, username: message }));
      } else if (duplicateField === 'email') {
        message = 'Email already exists';
        setErrors(prev => ({ ...prev, email: message }));
      }
      setServerError(message);
      toast.error(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      profileImage: null,
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      username: item.username || '',
      password: '',
      email: item.email || '',
      role: item.role || '',
    });
    setImagePreview(item.image || '');
    setServerError('');
    setSuccessMsg('');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteStaffApi(id);
      await loadStaff();
    } catch {
      // ignore
    }
  };

  const filteredStaff = useMemo(() => {
    // Filter out SuperAdmin from the list
    const nonSuperAdminStaff = staffList.filter(s => s.role !== 'SuperAdmin');
    
    const q = search.trim().toLowerCase();
    if (!q) return nonSuperAdminStaff;
    return nonSuperAdminStaff.filter(s =>
      (s.username || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.role || '').toLowerCase().includes(q)
    );
  }, [search, staffList]);

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({ profileImage: null, firstName: '', lastName: '', username: '', password: '', email: '', role: '' });
    setImagePreview('');
    setServerError('');
    setSuccessMsg('');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="mx-auto w-full">
        {/* Staff List Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Staff</h2>
              <p className="text-indigo-100 text-sm">Manage existing staff</p>
            </div>
            <button
              onClick={openAddDialog}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 shadow"
            >
              <Plus className="w-4 h-4" /> Add Staff
            </button>
          </div>
          <div className="p-6">
            {successMsg && (
              <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 border border-green-200">{successMsg}</div>
            )}
            <div className="flex items-center justify-between pb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, role"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((s) => (
                    <tr key={s._id}>
                      <td className="px-4 py-2">
                        <Avatar
                          src={s.image}
                          name={s.username}
                          size="md"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">{s.username}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{s.email}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">{s.role}</span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {(() => {
                          // Consider user online if lastActiveAt within last 5 minutes OR current session user
                          const lastActiveAt = s.lastActiveAt ? new Date(s.lastActiveAt) : null;
                          const now = new Date();
                          const recent = lastActiveAt && (now - lastActiveAt) < 5 * 60 * 1000;
                          const currentStaffId = getCurrentStaffId();
                          const sessionMatch = currentStaffId && currentStaffId === String(s._id);
                          const isOnline = Boolean(recent || sessionMatch);
                          return isOnline ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                              sessionMatch 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}>
                              {sessionMatch ? 'You (Online)' : 'Online'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">Offline</span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          onClick={() => startEdit(s)}
                          className="inline-flex items-center justify-center p-2 rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="inline-flex items-center justify-center p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                          aria-label="Delete"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500 text-sm">
                        No staff found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Dialog: Add/Edit Staff */}
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeDialog} />
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">{editingId ? 'Edit Staff' : 'Add Staff'}</h1>
                  <p className="text-indigo-100 text-xs">{editingId ? 'Update staff details' : 'Create a new staff account'}</p>
                </div>
                <button onClick={closeDialog} className="p-2 rounded-full hover:bg-white/20 text-white" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
        </div>
              <form onSubmit={async (e) => { const ok = await handleSubmit(e); if (ok) setIsDialogOpen(false); }} className="p-6 space-y-6">
          {serverError && (
            <div className="p-3 rounded-md bg-red-50 text-red-700 border border-red-200">{serverError}</div>
          )}
          {/* Profile Image Upload */}
          <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
              Profile Image
            </label>
            <div className="flex items-center space-x-6">
              <div className="relative">
                  <Avatar
                    src={imagePreview}
                    name={formData.username}
                    size="xl"
                    className="border-4 border-indigo-200 shadow-lg"
                  />
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-upload"
                />
                <label
                  htmlFor="profile-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                        <Upload className="h-4 w-4 mr-2 text-gray-500" />
                  Choose Image
                </label>
              </div>
            </div>
          </div>

                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-2 border ${errors.firstName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-lg placeholder-gray-400 focus:outline-none`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-2 border ${errors.lastName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-lg placeholder-gray-400 focus:outline-none`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
                  </div>
            <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                        className={`block w-full pl-10 pr-3 py-2 border ${errors.username ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-lg placeholder-gray-400 focus:outline-none`}
                  placeholder="Enter username"
                />
              </div>
                    {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username}</p>}
            </div>

            <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                        className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-lg placeholder-gray-400 focus:outline-none`}
                  placeholder="Enter email address"
                />
              </div>
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">{editingId ? 'New Password (optional)' : 'Password'}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                        className={`block w-full pl-10 pr-3 py-2 border ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-lg placeholder-gray-400 focus:outline-none`}
                        placeholder={editingId ? 'Leave blank to keep existing password' : 'Enter password'}
                />
              </div>
                    {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div className="space-y-2">
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-700">Role Assignment</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCheck className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                        className={`block w-full pl-10 pr-8 py-2 border ${errors.role ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-lg focus:outline-none appearance-none bg-white`}
                >
                  <option value="" disabled>Select a role</option>
                        <option value="Basic Clerk">Basic Clerk</option>
                        <option value="IT Clerk">IT Clerk</option>
                        <option value="Basic Manager">Basic Manager</option>
                        <option value="IT Manager">IT Manager</option>
                </select>
              </div>
                    {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role}</p>}
            </div>
          </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={closeDialog} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={submitting} className={`inline-flex items-center px-5 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? 'Saving...' : editingId ? 'Update Staff' : 'Create Staff'}
            </button>
          </div>
        </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssignStaff