import React, { useState } from 'react';
import { FaTimes, FaLock, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../services/api';

const UpdatePasswordDialog = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Generate OTP, 2: OTP, 3: New Password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerateOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/generate-otp');
      setSuccess('OTP sent to your email successfully!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/verify-otp', { otp });
      setSuccess('OTP verified successfully!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/update-password', { 
        newPassword, 
        confirmPassword 
      });
      setSuccess('Password updated successfully!');
      setTimeout(() => {
        onClose();
        // Reset form
        setStep(1);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FaLock className="text-green-600" />
            </div>
                           <div>
                 <h2 className="text-xl font-semibold text-gray-900">Update Password</h2>
                 <p className="text-sm text-gray-600">
                   {step === 1 && 'Click to receive OTP on your email'}
                   {step === 2 && 'Enter the OTP sent to your email'}
                   {step === 3 && 'Enter your new password'}
                 </p>
               </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

                     {/* Step 1: Generate OTP */}
           {step === 1 && (
             <div className="space-y-4">
               <div className="text-center">
                 <p className="text-gray-600 mb-4">
                   OTP will be sent to your registered email address
                 </p>
               </div>
               <button
                 onClick={handleGenerateOTP}
                 disabled={loading}
                 className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 {loading ? 'Sending OTP...' : 'Send OTP'}
               </button>
             </div>
           )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg font-mono"
                  placeholder="000000"
                  maxLength={6}
                />
                                 <p className="text-xs text-gray-500 mt-1">
                   Enter the 6-digit OTP sent to your email
                 </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleUpdatePassword}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordDialog;
