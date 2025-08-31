import React, { useState, useEffect } from 'react';
import { X, Smartphone, RotateCcw, Monitor, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import API_CONFIG, { getApiUrl, getEndpoint } from '../config/apiConfig.js';

// Helper function to convert QR code string to base64 image
const convertQRStringToBase64 = async (qrString) => {
  try {
    // Import qrcode library dynamically
    const QRCode = (await import('qrcode')).default;
    
    // Convert QR string to data URL
    const dataUrl = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Extract base64 data from data URL
    return dataUrl.split(',')[1];
  } catch (error) {
    console.error('Error converting QR string to base64:', error);
    return null;
  }
};

const WhatsAppQRScanner = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState('waiting');
  const [error, setError] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startQRGeneration();
    }
    
    // Cleanup polling on unmount or when dialog closes
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    };
  }, [isOpen]);

  // Socket.IO listener for real-time WhatsApp status updates
  useEffect(() => {
    // Check if Socket.IO is available (from global window object)
    if (window.io) {
      const socket = window.io();
      
      // Listen for WhatsApp ready event
      socket.on('whatsapp-ready', (data) => {
        console.log('🎉 WhatsApp ready event received via Socket.IO in QRScanner:', data);
        
        if (!hasShownSuccessToast) {
          console.log('✅ Processing whatsapp-ready event...');
          setHasShownSuccessToast(true);
          
          // Clear polling interval immediately
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
          }
          
          // Close dialog
          handleClose();
        } else {
          console.log('⚠️ Success toast already shown, ignoring event');
        }
      });
      
      // Listen for general WhatsApp status updates
      socket.on('whatsapp-status', (data) => {
        console.log('📱 WhatsApp status update via Socket.IO in QRScanner:', data);
        
        if (data.status === 'connected' && !hasShownSuccessToast) {
          console.log('✅ Processing whatsapp-status connected event...');
          setHasShownSuccessToast(true);
          
          // Clear polling interval immediately
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
          }
          
          // Close dialog
          handleClose();
        } else if (data.status === 'connected') {
          console.log('⚠️ Success toast already shown for status event, ignoring');
        } else if (data.status === 'retrying') {
          console.log('🔄 WhatsApp is retrying connection...');
          setStatus('generating');
          setError('');
        } else if (data.status === 'retry_failed') {
          console.log('⚠️ WhatsApp retry failed, trying alternative method...');
          setStatus('generating');
          setError('');
        } else if (data.status === 'reconnected') {
          console.log('✅ WhatsApp reconnected successfully!');
          setHasShownSuccessToast(true);
          
          // Clear polling interval immediately
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
          }
          
          // Close dialog
          handleClose();
        } else if (data.status === 'connection_failed') {
          console.log('❌ WhatsApp connection failed after multiple attempts');
          setError('WhatsApp connection failed after multiple attempts. Please try again later.');
          setStatus('error');
          
          // Clear polling interval
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
          }
        } else if (data.status === 'error') {
          console.log('❌ WhatsApp error:', data.message);
          setError(data.message || 'WhatsApp connection error occurred');
          setStatus('error');
          
          // Clear polling interval
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
          }
        }
      });
      
      // Cleanup socket connection
      return () => {
        socket.disconnect();
      };
    }
  }, [isOpen, hasShownSuccessToast, pollingInterval, timeoutId]);

  // Add immediate status check when component mounts
  useEffect(() => {
    if (isOpen && status === 'generating') {
      // Check status immediately after 1 second
      const immediateCheck = setTimeout(() => {
        checkWhatsAppStatus();
      }, 1000);
      
      return () => clearTimeout(immediateCheck);
    }
  }, [isOpen, status]);

  // Polling function to check WhatsApp status
  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch(getApiUrl(getEndpoint('WHATSAPP', 'STATUS')));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('📊 WhatsApp Status Check:', data);
      
      // If WhatsApp is already connected, stop polling immediately
      if (data.success && data.status && data.status.isReady) {
        console.log('✅ WhatsApp already connected, stopping polling');
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(null);
        }
        
        // If not already shown success toast, close dialog
        if (!hasShownSuccessToast) {
          console.log('✅ WhatsApp already connected, closing dialog');
          setHasShownSuccessToast(true);
          handleClose();
        }
        
        setStatus('ready');
        return;
      }
      
      // Check if QR code is available
      if (data.success && data.qrCodeData && data.qrCodeData.trim() !== '') {
        console.log('📱 QR Code received, updating UI');
        console.log('📱 QR Code data length:', data.qrCodeData.length);
        setQrCodeData(data.qrCodeData);
        
        // Convert QR string to base64 image
        try {
          const base64Image = await convertQRStringToBase64(data.qrCodeData);
          if (base64Image) {
            setQrCodeImage(base64Image);
            setStatus('ready');
            setError('');
          } else {
            setError('Failed to generate QR code image');
            setStatus('error');
          }
        } catch (error) {
          console.error('Error converting QR code:', error);
          setError('Failed to generate QR code image');
          setStatus('error');
        }
      }
      
      // Check if WhatsApp is initialized but not ready yet
      if (data.success && data.status && data.status.isInitialized && !data.status.isReady) {
        console.log('📱 WhatsApp initialized, waiting for QR scan...');
        setStatus('ready');
        
        // Store QR code data if available
        if (data.qrCodeData && data.qrCodeData.trim() !== '') {
          setQrCodeData(data.qrCodeData);
        }
      }
      
      // Check if WhatsApp is fully connected (ready)
      if (data.success && data.status && data.status.isReady && !hasShownSuccessToast) {
        console.log('✅ WhatsApp fully connected via polling!');
        // Auto-close dialog
        setHasShownSuccessToast(true);
        
        // Clear polling interval immediately
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(null);
        }
        
        handleClose();
        return; // Exit early
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      
      // Check for specific error types
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setError('Server connection lost. Please check your internet connection and try again.');
        setStatus('error');
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(null);
        }
      }
    }
  };

  const startQRGeneration = async () => {
    try {
      setStatus('generating');
      setError('');

      console.log('🚀 Starting QR generation...');

      // Call backend to initialize WhatsApp and get QR code
      const response = await fetch(getApiUrl(getEndpoint('WHATSAPP', 'INITIALIZE')) + '?forceNewQR=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📡 Initialize response:', data);

      if (data.success) {
        console.log('✅ WhatsApp initialization started, beginning polling...');
        
        // Start polling to check when QR code is generated and WhatsApp is ready
        const interval = setInterval(checkWhatsAppStatus, 1000);
        setPollingInterval(interval);
        
        // Set a timeout to stop polling after 60 seconds
        const timeout = setTimeout(() => {
          if (interval) {
            clearInterval(interval);
            setPollingInterval(null);
            if (status === 'generating') {
              setError('QR code generation timed out. The server may be experiencing issues. Please try again.');
              setStatus('error');
            }
          }
        }, 60000);
        setTimeoutId(timeout);
        
        // Also stop polling if dialog closes
        if (!isOpen) {
          clearInterval(interval);
          setPollingInterval(null);
          clearTimeout(timeout);
          setTimeoutId(null);
          return; // Exit early if dialog is closed
        }
      } else {
        console.error('❌ WhatsApp initialization failed:', data.message);
        
        // Handle specific error types
        let errorMessage = data.message || 'Failed to generate QR code';
        
        if (data.message && data.message.includes('EBUSY')) {
          errorMessage = 'WhatsApp session is currently busy. The server is restarting. Please wait a moment and try again.';
        } else if (data.message && data.message.includes('ECONNREFUSED')) {
          errorMessage = 'Cannot connect to WhatsApp service. Please check if the server is running.';
        } else if (data.message && data.message.includes('timeout')) {
          errorMessage = 'WhatsApp initialization timed out. Please try again.';
        }
        
        setError(errorMessage);
        setStatus('error');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      
      let errorMessage = 'Failed to connect to server';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Server is not responding. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      setError(errorMessage);
      setStatus('error');
    }
  };

  const handleRetry = () => {
    if (retryCount >= maxRetries) {
      setError('Maximum retry attempts reached. Please try again later or contact support.');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    setStatus('waiting');
    setError('');
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    // Add a small delay before retrying
    setTimeout(() => {
      startQRGeneration();
    }, 1000);
  };

  const handleClose = () => {
    console.log('🚪 Closing WhatsApp QR Scanner dialog...');
    setStatus('waiting');
    setError('');
    setRetryCount(0);
    setHasShownSuccessToast(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    onClose();
  };

  // Force close function for emergency situations
  const forceClose = () => {
    console.log('🚪 Force closing WhatsApp QR Scanner dialog...');
    setStatus('waiting');
    setError('');
    setRetryCount(0);
    setHasShownSuccessToast(true); // Prevent further events
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    onClose();
  };

  // Auto-close after successful connection (backup method)
  useEffect(() => {
    if (hasShownSuccessToast) {
      console.log('✅ Success toast shown, auto-closing dialog in 2 seconds...');
      const autoCloseTimer = setTimeout(() => {
        forceClose();
      }, 2000);
      
      return () => clearTimeout(autoCloseTimer);
    }
  }, [hasShownSuccessToast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Smartphone className="text-green-600" />
            <span>Connect WhatsApp</span>
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="text-center">
          {/* Debug Information - Only in development */}
          {import.meta.env.DEV && (
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
              <div>Status: {status}</div>
              <div>Has Shown Success: {hasShownSuccessToast ? 'Yes' : 'No'}</div>
              <div>Retry Count: {retryCount}/{maxRetries}</div>
              <div>Socket.IO: {window.io ? 'Available' : 'Not Available'}</div>
            </div>
          )}
          {status === 'generating' && (
            <div className="py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating QR Code...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we prepare the QR code</p>
              <p className="text-xs text-gray-400 mt-1">This may take 10-30 seconds</p>
              {retryCount > 0 && (
                <p className="text-xs text-orange-500 mt-1">Retry attempt: {retryCount}/{maxRetries}</p>
              )}
              
              {/* Progress indicators */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Initializing WhatsApp service...</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>Preparing QR code...</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Establishing connection...</span>
                </div>
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="py-4">
              {/* Success Message */}
              {hasShownSuccessToast && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-green-600 text-sm font-medium mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>WhatsApp Connected Successfully!</span>
                  </div>
                  <p className="text-green-700 text-sm">
                    Your WhatsApp is now connected. The dialog will close automatically in a few seconds.
                  </p>
                </div>
              )}
              
              {/* QR Code Display Area */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Monitor className="text-gray-500" size={20} />
                  <span className="text-gray-700 font-medium">QR Code</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 inline-block">
                  {qrCodeImage ? (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <img 
                        src={`data:image/png;base64,${qrCodeImage}`} 
                        alt="WhatsApp QR Code"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('❌ QR Code image failed to load');
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">QR Code Loading...</div>
                        <div className="text-gray-600 font-medium">Please wait</div>
                        <div className="text-xs text-gray-400 mt-1">Checking for QR code...</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw size={16} />
                  <span>Generate New QR</span>
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
              </div>
              
              {/* Emergency close button */}
              <div className="mt-3">
                <button
                  onClick={forceClose}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                >
                  Force Close (if stuck)
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 text-red-600 text-sm font-medium mb-2">
                  <AlertTriangle size={16} />
                  <span>Connection Failed</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{error}</p>
                {retryCount > 0 && (
                  <p className="text-xs text-orange-600">Attempt {retryCount} of {maxRetries}</p>
                )}
              </div>
              
              <div className="flex space-x-3">
                {retryCount < maxRetries ? (
                  <button
                    onClick={handleRetry}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <RotateCcw size={16} />
                    <span>Retry</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRetry}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Wifi size={16} />
                    <span>Try Again</span>
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppQRScanner;
