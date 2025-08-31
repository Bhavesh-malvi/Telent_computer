import whatsappConnectionService from '../services/whatsapp/core/connectionService.js';
import whatsappMessageService from '../services/whatsapp/core/messageService.js';
import automaticReminderService from '../services/automaticReminderService.js';
import Student from '../Model/Student.js';
import ReminderSettings from '../Model/ReminderSettings.js';

// Listen for WhatsApp ready event
whatsappConnectionService.on('ready', (data) => {
  // Emit to all connected clients via Socket.IO
  if (global.__io) {
    global.__io.emit('whatsapp-ready', {
      message: data.message,
      timestamp: data.timestamp
    });
  }
});

const whatsappController = {
  // Initialize WhatsApp service
  initializeWhatsApp: async (req, res) => {
    try {
      // Check if force new QR is requested
      const forceNewQR = req.query.forceNewQR === 'true';
      
      if (forceNewQR) {
        try {
          await whatsappConnectionService.initialize();
        } catch (error) {
          // Continue anyway, don't fail the request
        }
      } else {
        // Always start with fresh initialization to ensure new QR
        try {
          await whatsappConnectionService.initialize(); // Always force new QR for fresh start
        } catch (error) {
          // Fallback to normal initialization
          whatsappConnectionService.initialize().catch(error => {
            // Background initialization failed
          });
        }
      }
      
      // Return success immediately
      res.json({
        success: true,
        message: forceNewQR ? 'New QR generation started' : 'Fresh WhatsApp initialization started',
        status: whatsappConnectionService.getStatus()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error starting WhatsApp initialization',
        error: error.message
      });
    }
  },

  // Get WhatsApp status
  getWhatsAppStatus: async (req, res) => {
    try {
      // Get status without forcing ready check to avoid loops
      const status = whatsappConnectionService.getStatus();
      const qrCodeData = whatsappConnectionService.getQRCode(); // Get actual QR code
      const sessionStatus = { status: status.isReady ? 'connected' : 'disconnected' };
      
      res.json({
        success: true,
        status: status,
        qrCodeData: qrCodeData,
        sessionStatus: sessionStatus
      });
    } catch (error) {
      console.error('❌ Error in getWhatsAppStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting WhatsApp status',
        error: error.message
      });
    }
  },

  // Send WhatsApp reminders
  sendWhatsAppReminders: async (req, res) => {
    try {
      
      // Get pending students with contact numbers (only Admission students, not Enquiry)
      const students = await Student.find({ 
        "installments.paid": false,
        "contactNo": { $exists: true, $ne: null, $ne: "" },
        "enquiryType": "Admission" // Only show Admission students, not Enquiry
      })
      .populate("selectedCourses", "name")
      .select("name selectedCourses installments paymentHistory date studentId contactNo lastReminderDate nextReminderDate reminderCount enquiryType");

      console.log(`📊 Found ${students.length} students with pending fees and contact numbers`);

      const pendingStudents = [];
      const now = new Date();

      // Process each student
      for (const student of students) {
        student.installments.forEach((inst, index) => {
          if (!inst.paid && inst.amount && inst.dueDate) {
            const dueDate = new Date(inst.dueDate);
            const daysDiff = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
            
            // Only include students with 1+ months due or 2+ months overdue
            if (daysDiff > 30) {
              const monthsDiff = Math.floor(daysDiff / 30);
              
              let status = null;
              if (daysDiff > 60) {
                status = `Overdue ${monthsDiff}+ months`;
              } else if (daysDiff > 30) {
                status = `Due ${monthsDiff}+ months`;
              }

              if (status) {
                pendingStudents.push({
                  id: `${student._id}_${index}`,
                  studentName: student.name,
                  studentId: student.studentId,
                  contactNo: student.contactNo,
                  courseNames: student.selectedCourses.map(c => c.name),
                  amount: inst.amount,
                  dueDate: inst.dueDate,
                  status: status,
                  daysPastDue: daysDiff,
                  monthsPastDue: monthsDiff
                });
              }
            }
          }
        });
      }

      if (pendingStudents.length === 0) {
        return res.json({
          success: true,
          message: 'No students eligible for WhatsApp reminders',
          results: []
        });
      }

              // Send WhatsApp reminders
        const reminderResults = await automaticReminderService.sendFeeReminders(pendingStudents);

      res.json({
        success: true,
        message: `WhatsApp reminders sent to ${pendingStudents.length} students`,
        results: reminderResults
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending WhatsApp reminders',
        error: error.message
      });
    }
  },

  // Test reminders (manual trigger)
  testReminders: async (req, res) => {
    try {
      
      // Check if WhatsApp is ready
      if (!whatsappConnectionService.isReady) {
        return res.status(400).json({
          success: false,
          message: 'WhatsApp client is not ready. Please scan QR code first.',
          status: whatsappConnectionService.getStatus()
        });
      }

      // Use the SAME logic as frontend getPendingInstallments
      const now = new Date();
      const in30Days = new Date(now);
      in30Days.setDate(now.getDate() + 30);

      // Get students with unpaid installments (only Admission students, not Enquiry)
      const students = await Student.find({ 
        "installments.paid": false,
        "enquiryType": "Admission" // Only show Admission students, not Enquiry
      })
        .populate("selectedCourses", "name")
        .select("name selectedCourses installments paymentHistory date studentId contactNo lastReminderDate nextReminderDate reminderCount enquiryType");

      const pendingStudents = [];

      // Process each student using EXACT same logic as frontend
      students.forEach(student => {
        
        student.installments.forEach((inst, index) => {
          if (!inst.paid && inst.amount && inst.dueDate) {
            const dueDate = new Date(inst.dueDate);
            
            // Check if student has made recent payments (SAME LOGIC AS FRONTEND)
            let shouldInclude = true;
            
            if (student.paymentHistory && student.paymentHistory.length > 0) {
              // Get the most recent payment date
              const recentPayments = student.paymentHistory
                .filter(payment => payment.date)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
              
              if (recentPayments.length > 0) {
                const lastPaymentDate = new Date(recentPayments[0].date);
                
                // If last payment was within 7 days of due date, exclude from pending
                const daysDiff = Math.floor((dueDate - lastPaymentDate) / (1000 * 60 * 60 * 24));
                
                // Exclude if payment was made within 7 days before due date OR after due date
                if (daysDiff <= 7) {
                  shouldInclude = false;
                  console.log(`Excluding student ${student.studentId} - recent payment within 7 days of due date`);
                }
              }
            } else {
              // No payment history, use registration date
              if (student.date) {
                const registrationDate = new Date(student.date);
                const daysSinceRegistration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
                
                // If registration was within 30 days, exclude from pending
                if (daysSinceRegistration <= 30) {
                  shouldInclude = false;
                  console.log(`Excluding student ${student.studentId} - recent registration within 30 days`);
                }
              }
            }
            
            if (shouldInclude) {
              const daysDiff = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
              const monthsDiff = Math.floor(daysDiff / 30);
              
              let status = null;
              if (daysDiff > 60) {
                status = `Overdue ${monthsDiff}+ months`; // 🔴 Overdue 2+ months
              } else if (daysDiff > 0) {
                status = `Due ${monthsDiff}+ months`; // 🟡 Due X+ months
              } else if (dueDate <= in30Days) {
                status = 'Due Soon'; // 🟡 Due within 30 days
              }

              if (status && student.contactNo) {
                pendingStudents.push({
                  id: `${student._id}_${index}`,
                  studentName: student.name,
                  studentId: student.studentId,
                  contactNo: student.contactNo,
                  courseNames: student.selectedCourses.map(c => c.name),
                  amount: inst.amount,
                  dueDate: inst.dueDate,
                  status: status,
                  daysPastDue: daysDiff > 0 ? daysDiff : 0,
                  monthsPastDue: monthsDiff > 0 ? monthsDiff : 0,
                  _id: student._id,
                  lastReminderDate: student.lastReminderDate,
                  nextReminderDate: student.nextReminderDate,
                  reminderCount: student.reminderCount
                });
              }
            }
          }
        });
      });

      console.log(`📋 Found ${pendingStudents.length} students eligible for reminders (matching frontend logic)`);

      if (pendingStudents.length === 0) {
        return res.json({
          success: true,
          message: 'No students eligible for reminders',
          eligibleCount: 0
        });
      }

      // Send test reminders
      const reminderResults = await automaticReminderService.sendFeeReminders(pendingStudents);
      
      res.json({
        success: true,
        message: `Test reminders sent to ${pendingStudents.length} students`,
        eligibleCount: pendingStudents.length,
        results: reminderResults
      });

    } catch (error) {
      console.error('❌ Error in test reminders:', error);
      res.status(500).json({
        success: false,
        message: 'Error testing reminders',
        error: error.message
      });
    }
  },

  // Test automatic reminders manually
  async testAutomaticReminders(req, res) {
    try {
      console.log('🔧 Manually triggering automatic reminders for testing...');
      
      // Import automatic reminder service
      const automaticReminderService = (await import('../services/automaticReminderService.js')).default;
      
      // Trigger automatic reminders
      await automaticReminderService.triggerNow();
      
      res.json({
        success: true,
        message: 'Automatic reminders triggered successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error triggering automatic reminders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger automatic reminders',
        error: error.message
      });
    }
  },

  // Disconnect WhatsApp (temporary disconnect)
  disconnectWhatsApp: async (req, res) => {
    try {
      console.log('🛑 Temporarily disconnecting WhatsApp...');
      await whatsappConnectionService.disconnect();
      
      res.json({
        success: true,
        message: 'WhatsApp temporarily disconnected'
      });
    } catch (error) {
      console.error('❌ Error disconnecting WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: 'Error disconnecting WhatsApp',
        error: error.message
      });
    }
  },

  // Force disconnect WhatsApp (manual disconnect - requires QR scan to reconnect)
  forceDisconnectWhatsApp: async (req, res) => {
    try {
      console.log('🛑 User initiated force disconnect of WhatsApp...');
      await whatsappConnectionService.disconnect();
      
      res.json({
        success: true,
        message: 'WhatsApp manually disconnected. QR scan will be required to reconnect.'
      });
    } catch (error) {
      console.error('❌ Error force disconnecting WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: 'Error force disconnecting WhatsApp',
        error: error.message
      });
    }
  },

  // Get automatic reminder status
  async getAutomaticReminderStatus(req, res) {
    try {
      const automaticReminderService = (await import('../services/automaticReminderService.js')).default;
      const status = automaticReminderService.getStatus();
      
      res.json({
        success: true,
        status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get automatic reminder status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get today's summary of birthday wishes and fee reminders
  async getTodaySummary(req, res) {
    try {
      const logger = (await import('../utils/logger.js')).default;
      const summary = logger.getTodaySummary();
      
      res.json({
        success: true,
        summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get today\'s summary',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get weekly summary of birthday wishes and fee reminders
  async getWeeklySummary(req, res) {
    try {
      const logger = (await import('../utils/logger.js')).default;
      const summary = logger.getWeeklySummary();
      
      res.json({
        success: true,
        summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get weekly summary',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get reminder settings
  async getReminderSettings(req, res) {
    try {
      // Get settings from database or use defaults
      const settings = await ReminderSettings.findOne() || {
        reminderGap: 4, // Default 4 days
        reminderTime: '10:00', // Default 10:00 AM
        isActive: true
      };
      
      res.json({
        success: true,
        settings: settings
      });
    } catch (error) {
      console.error('❌ Error getting reminder settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reminder settings'
      });
    }
  },

  // Update reminder settings
  async updateReminderSettings(req, res) {
    try {
      const { reminderGap, reminderTime } = req.body;
      
      // Validate inputs
      if (reminderGap < 1 || reminderGap > 10) {
        return res.status(400).json({
          success: false,
          message: 'Reminder gap must be between 1 and 10 days'
        });
      }
      
      if (!reminderTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format. Use HH:MM format (e.g., 10:00)'
        });
      }
      
      // Update or create settings
      const settings = await ReminderSettings.findOneAndUpdate(
        {},
        { reminderGap, reminderTime },
        { upsert: true, new: true }
      );
      
      // Update automatic reminder service with new settings
      await automaticReminderService.updateSettings(settings);
      
      res.json({
        success: true,
        message: 'Reminder settings updated successfully',
        settings: settings
      });
    } catch (error) {
      console.error('❌ Error updating reminder settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update reminder settings'
      });
    }
  },

  // Get birthday wishes WhatsApp connection status
  async getBirthdayWishesStatus(req, res) {
    try {
      const automaticBirthdayWishes = (await import('../services/automaticBirthdayWishes.js')).default;
      const whatsappStatus = await automaticBirthdayWishes.checkWhatsAppConnection();
      
      // Also check if there are any students in database
      const totalStudents = await Student.countDocuments({ 
        enquiryType: 'Admission',
        status: { $ne: 'ex-student' }
      });
      
      // Check today's birthday students
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      const todayBirthdayStudents = await Student.find({
        $expr: {
          $and: [
            { $eq: [{ $month: '$dob' }, month] },
            { $eq: [{ $dayOfMonth: '$dob' }, day] }
          ]
        },
        enquiryType: 'Admission',
        status: { $ne: 'ex-student' }
      });
      
      res.json({
        success: true,
        whatsappStatus: whatsappStatus,
        databaseStatus: {
          totalStudents: totalStudents,
          todayBirthdayStudents: todayBirthdayStudents.length,
          hasStudents: totalStudents > 0,
          hasTodayBirthdays: todayBirthdayStudents.length > 0
        },
        canSendWishes: whatsappStatus.connected && totalStudents > 0,
        message: whatsappStatus.connected 
          ? (totalStudents > 0 
              ? 'WhatsApp connected and students available' 
              : 'WhatsApp connected but no students in database')
          : 'WhatsApp not connected'
      });
    } catch (error) {
      console.error('❌ Error getting birthday wishes status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get birthday wishes status',
        error: error.message
      });
    }
  },

  // Test birthday wishes manually
  async testBirthdayWishes(req, res) {
    try {
      const automaticBirthdayWishes = (await import('../services/automaticBirthdayWishes.js')).default;
      
      console.log('🧪 Testing birthday wishes manually...');
      
      // Run the birthday wishes function
      await automaticBirthdayWishes.sendAutomaticBirthdayWishes();
      
      res.json({
        success: true,
        message: 'Birthday wishes test completed. Check console logs for details.'
      });
    } catch (error) {
      console.error('❌ Error testing birthday wishes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test birthday wishes',
        error: error.message
      });
    }
  }
};

export default whatsappController;
