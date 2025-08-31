import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, CreditCard, DollarSign, Calendar, MessageCircle, Loader2 } from 'lucide-react';
import API_CONFIG, { getApiUrl, getEndpoint } from '../../config/apiConfig.js';

const DailyPayments = ({ dailyPayments, pendingPayments }) => {
  const [whatsappStatus, setWhatsappStatus] = useState({ isReady: false, isInitialized: false });

  const todayRevenue = dailyPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingRevenue = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const overduePendingPayments = pendingPayments.filter(p => p.status.startsWith('Overdue'));

  // Students eligible for WhatsApp reminders (1+ months due or 2+ months overdue)
  const eligibleForReminders = pendingPayments.filter(p => 
    p.status.includes('Due') || p.status.includes('Overdue')
  );

  // Check WhatsApp status on component load (only once)
  useEffect(() => {
    const checkWhatsAppStatus = async () => {
      try {
        const response = await fetch(getApiUrl(getEndpoint('WHATSAPP', 'STATUS')));
        const data = await response.json();
        
        if (data.success) {
          setWhatsappStatus(data.status);
        }
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
        // Set default status on error
        setWhatsappStatus({ isReady: false, isInitialized: false });
      }
    };
    
    checkWhatsAppStatus();
  }, []);

  // WhatsApp Status Check (Automatic System)

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'text-green-600 bg-green-50';
      case 'Due Today':
        return 'text-yellow-600 bg-yellow-50';
      case 'Overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Today's Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Today's Payments</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">Payments received today</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">₹{todayRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{dailyPayments.length} payments</p>
          </div>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {dailyPayments.map((payment, index) => (
            <div key={`daily-${payment.id || payment.studentId}-${payment.amount}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div>
                  {/* Show student image if available, else fallback to icon */}
                  {payment.studentImage ? (
                    <img src={payment.studentImage} alt="student" className="h-8 w-8 rounded-full bg-white border" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{payment.studentName}</p>
                  {/* Show all course names */}
                  {Array.isArray(payment.courseNames) && payment.courseNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {payment.courseNames.map((name, idx) => (
                        <span key={`daily-course-${payment.studentId}-${name}-${idx}`} className="text-sm text-gray-600 bg-gray-200 rounded px-2 py-0.5">{name}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">{payment.courseName}</p>
                  )}
                  <p className="text-xs text-gray-500">ID: {payment.studentId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">₹{payment.amount}</p>
                <p className="text-xs text-gray-500">{payment.method}</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                  {payment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span>Pending Payments</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">Due today and overdue payments</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-600">₹{pendingRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{pendingPayments.length} pending</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Due 1+ months</span>
            </div>
            <p className="text-lg font-bold text-yellow-900">
              {pendingPayments.filter(p => p.status.startsWith('Due') && !p.status.startsWith('Due Soon')).length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Overdue</span>
            </div>
            <p className="text-lg font-bold text-red-900">{overduePendingPayments.length}</p>
          </div>
        </div>

        {/* WhatsApp Automatic Reminder Section */}
        {eligibleForReminders.length > 0 && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900 flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Automatic WhatsApp Reminders</span>
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  {eligibleForReminders.length} students eligible for automatic reminders
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ⏰ Daily reminders at 10:00 AM • 5-day gap between reminders
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-green-700 font-medium">
                  🤖 Automatic
                </div>
                {!whatsappStatus.isReady && (
                  <div className="text-sm text-orange-600">
                    ⚠️ WhatsApp not connected
                  </div>
                )}
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="mt-3 flex space-x-4 text-xs">
              <div className={`flex items-center space-x-1 ${whatsappStatus.isInitialized ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${whatsappStatus.isInitialized ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>WhatsApp Ready</span>
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Auto System Active</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-600">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Daily at 10:00 AM</span>
              </div>
            </div>

            {/* Info Display */}
            <div className="mt-3 p-2 bg-white rounded border">
              <p className="text-xs text-gray-600">
                ✅ Automatic system running • Only eligible students will receive reminders • 5-day gap maintained
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {pendingPayments.map((payment, index) => (
            <div key={`pending-${payment.id || payment.studentId}-${payment.amount}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div>
                  {/* Show student image if available, else fallback to icon */}
                  {payment.studentImage ? (
                    <img src={payment.studentImage} alt="student" className="h-8 w-8 rounded-full bg-white border" />
                  ) : (
                    <div className={`p-2 rounded-lg ${payment.status.startsWith('Overdue') ? 'bg-red-100' : 'bg-yellow-100'}`}>
                      {payment.status.startsWith('Overdue') ? 
                        <AlertTriangle className="h-4 w-4 text-red-600" /> : 
                        <Clock className="h-4 w-4 text-yellow-600" />
                      }
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{payment.studentName}</p>
                  {/* Show all course names */}
                  {Array.isArray(payment.courseNames) && payment.courseNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {payment.courseNames.map((name, idx) => (
                        <span key={`pending-course-${payment.studentId}-${name}-${idx}`} className="text-sm text-gray-600 bg-gray-200 rounded px-2 py-0.5">{name}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">{payment.courseName}</p>
                  )}
                  <p className="text-xs text-gray-500">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">₹{payment.amount}</p>
                {payment.monthsPastDue > 0 && (
                  <p className="text-xs text-red-600">{payment.monthsPastDue}+ months overdue</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyPayments;