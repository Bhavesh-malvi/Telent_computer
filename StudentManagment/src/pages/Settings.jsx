import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, Settings as SettingsIcon, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
// WhatsApp UI removed
import API_CONFIG, { getApiUrl, getEndpoint } from '../config/apiConfig.js';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  // WhatsApp UI removed
  const [autoMessageSettings, setAutoMessageSettings] = useState({
    feeReminderTime: '10:00',
    feeReminderGapDays: 1,
    birthdayWishTime: '09:00',
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Password update states
  const [passwordStep, setPasswordStep] = useState('initial'); // 'initial', 'otp', 'newPassword', 'success'
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isLoadingPasswordUpdate, setIsLoadingPasswordUpdate] = useState(false);

  // Initialize settings on component mount
  useEffect(() => {
    loadAutoMessageSettings();
  }, []);

  // WhatsApp Socket.IO removed

  const loadAutoMessageSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await fetch(getApiUrl(getEndpoint('AUTO_MESSAGE_SETTINGS', 'GET_SETTINGS')), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setAutoMessageSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading auto message settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const saveAutoMessageSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(getApiUrl(getEndpoint('AUTO_MESSAGE_SETTINGS', 'UPDATE_SETTINGS')), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(autoMessageSettings)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAutoMessageSettings(data.settings);
        toast.success('Auto message settings saved successfully');
      } else {
        toast.error(data.message || 'Failed to save auto message settings');
      }
    } catch (error) {
      console.error('Error saving auto message settings:', error);
      toast.error('Failed to save auto message settings');
    } finally {
      setIsSaving(false);
    }
  };

  // WhatsApp status checks removed

  



  // Password update functions
  const handleUpdatePassword = async () => {
    setIsLoadingOtp(true);
    try {
      const response = await fetch(getApiUrl(getEndpoint('AUTH', 'GENERATE_OTP')), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.message) {
        toast.success('OTP sent successfully to your email!');
        setPasswordStep('otp');
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoadingOtp(true);
    try {
      const response = await fetch(getApiUrl(getEndpoint('AUTH', 'VERIFY_PASSWORD_OTP')), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp })
      });
      
      const data = await response.json();
      
      if (data.verified) {
        toast.success('OTP verified successfully!');
        setPasswordStep('newPassword');
        setOtp('');
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleUpdatePasswordFinal = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoadingPasswordUpdate(true);
    try {
      const response = await fetch(getApiUrl(getEndpoint('AUTH', 'UPDATE_PASSWORD')), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          newPassword, 
          confirmPassword 
        })
      });
      
      const data = await response.json();
      
      if (data.message) {
        toast.success('Password updated successfully!');
        setPasswordStep('success');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password. Please try again.');
    } finally {
      setIsLoadingPasswordUpdate(false);
    }
  };

  const handleClosePasswordDialog = () => {
    setActiveTab('profile');
    setPasswordStep('initial');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const renderPasswordDialog = () => {
    switch (passwordStep) {
      case 'initial':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-blue-600 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">Update Password</h3>
            <p className="text-sm text-gray-500 mb-6">
              We'll send a verification code to your email address to update your password.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleClosePasswordDialog}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={isLoadingOtp}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoadingOtp ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </div>
        );

      case 'otp':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">Enter Verification Code</h3>
            <p className="text-sm text-gray-500 mb-6">
              We've sent a 6-digit code to your email. Please enter it below.
            </p>
            <div className="mb-6">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setPasswordStep('initial')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={isLoadingOtp || otp.length !== 6}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoadingOtp ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        );

      case 'newPassword':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-purple-600 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">Set New Password</h3>
            <p className="text-sm text-gray-500 mb-6">
              Enter your new password below.
            </p>
            <div className="space-y-4 mb-6">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setPasswordStep('otp')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={handleUpdatePasswordFinal}
                disabled={isLoadingPasswordUpdate || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="flex-1 px-4 py-2 bg-purple-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {isLoadingPasswordUpdate ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">Password Updated!</h3>
            <p className="text-sm text-gray-500 mb-6">
              Your password has been updated successfully!
            </p>
            <button
              onClick={handleClosePasswordDialog}
              className="w-full px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              OK
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your profile and system settings</p>
            </div>
            
            {/* WhatsApp UI removed */}
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            {/* Header with Update Password Button */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-600">View your account details</p>
                </div>
              </div>
              
              <button
                onClick={() => setActiveTab('password')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Lock className="text-sm" />
                <span>Update Password</span>
              </button>
            </div>

            {/* Profile Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={localStorage.getItem('username') || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  value={localStorage.getItem('role') || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                <input
                  type="text"
                  value={localStorage.getItem('lastLoginAt') ? new Date(localStorage.getItem('lastLoginAt')).toLocaleString() : 'N/A'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            {/* Account Status */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Account Status</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-blue-700">Active</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Your account is active and you have access to all features.
              </p>
            </div>
          </div>
        </div>

                 {/* Reminder Settings Section */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
           <div className="p-6">
             <div className="flex items-center space-x-3 mb-6">
               <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                 <Bell className="text-orange-600 text-xl" />
               </div>
               <div>
                 <h2 className="text-xl font-semibold text-gray-900">Automatic Message Settings</h2>
                 <p className="text-sm text-gray-600">Configure automatic reminders and birthday wishes</p>
               </div>
             </div>

             <div className="space-y-6">
               {/* Fee Reminder Settings */}
               <div className="border-b border-gray-200 pb-6">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Fee Reminder Settings</h3>
                 
                 {/* Fee Reminder Gap Setting */}
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Reminder Gap (Days)
                   </label>
                   <select
                     value={autoMessageSettings.feeReminderGapDays}
                     onChange={(e) => setAutoMessageSettings({
                       ...autoMessageSettings,
                       feeReminderGapDays: parseInt(e.target.value)
                     })}
                     disabled={isLoadingSettings}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                   >
                     {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30].map(day => (
                       <option key={day} value={day}>
                         {day} {day === 1 ? 'Day' : 'Days'}
                       </option>
                     ))}
                   </select>
                   <p className="text-sm text-gray-500 mt-1">
                     Reminders will be sent only after this many days have passed since the last reminder
                   </p>
                 </div>

                 {/* Fee Reminder Time Setting */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Fee Reminder Time
                   </label>
                   <input
                     type="time"
                     value={autoMessageSettings.feeReminderTime}
                     onChange={(e) => setAutoMessageSettings({
                       ...autoMessageSettings,
                       feeReminderTime: e.target.value
                     })}
                     disabled={isLoadingSettings}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                   />
                   <p className="text-sm text-gray-500 mt-1">
                     Daily fee reminders will be sent at this time
                   </p>
                 </div>
               </div>

               {/* Birthday Wish Settings */}
               <div className="border-b border-gray-200 pb-6">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">🎂 Birthday Wish Settings</h3>
                 
                 {/* Birthday Wish Time Setting */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Birthday Wish Time
                   </label>
                   <input
                     type="time"
                     value={autoMessageSettings.birthdayWishTime}
                     onChange={(e) => setAutoMessageSettings({
                       ...autoMessageSettings,
                       birthdayWishTime: e.target.value
                     })}
                     disabled={isLoadingSettings}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                   />
                   <p className="text-sm text-gray-500 mt-1">
                     Daily birthday wishes will be sent at this time
                   </p>
                 </div>
               </div>

               {/* Save Button */}
               <div className="flex justify-end">
                 <button
                   onClick={saveAutoMessageSettings}
                   disabled={isSaving || isLoadingSettings}
                   className="px-6 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                 >
                   {isSaving ? 'Saving...' : 'Save Settings'}
                 </button>
               </div>

               {/* Current Settings Display */}
               <div className="p-4 bg-orange-50 rounded-lg">
                 <h3 className="font-medium text-orange-900 mb-2">Current Settings</h3>
                 <div className="space-y-1 text-sm text-orange-700">
                   <p>• Fee Reminder Gap: <span className="font-medium">{autoMessageSettings.feeReminderGapDays} {autoMessageSettings.feeReminderGapDays === 1 ? 'day' : 'days'}</span></p>
                   <p>• Fee Reminder Time: <span className="font-medium">{autoMessageSettings.feeReminderTime}</span></p>
                   <p>• Birthday Wish Time: <span className="font-medium">{autoMessageSettings.birthdayWishTime}</span></p>
                   <p>• System Status: <span className="font-medium text-green-600">Active</span></p>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>

      {/* Update Password Dialog */}
      {activeTab === 'password' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 border w-full max-w-md mx-auto bg-white rounded-lg shadow-xl">
            {renderPasswordDialog()}
          </div>
        </div>
      )}

      {/* WhatsApp UI removed */}
    </div>
  );
};

export default Profile;
