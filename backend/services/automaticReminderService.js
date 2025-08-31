import cron from 'node-cron';
import Student from '../Model/Student.js';
import whatsappConnectionService from './whatsapp/core/connectionService.js';
import whatsappMessageService from './whatsapp/core/messageService.js';
import ReminderSettings from '../Model/ReminderSettings.js';
import '../Model/studentCourse.js'; // Register StudentCourse model

class AutomaticReminderService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.lastRunDate = null;
    this.settings = {
      reminderGap: 4, // Default 4 days
      reminderTime: '11:30', // Default 11:30 AM (you can change this)
      isActive: true,
      birthdayWishTime: '11:00', // Default 11:00 AM
      birthdayWishesActive: true
    };
  }

  // Helper function to validate and format phone number
  validateAndFormatPhone(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Remove all non-digits
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number
    if (cleaned.length === 10) {
      // 10 digits - add 91 prefix
      return '91' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      // 12 digits with 91 prefix - valid
      return cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      // 11 digits starting with 0 - remove 0 and add 91
      return '91' + cleaned.substring(1);
    }
    
    return null; // Invalid format
  }

  // Load settings from database
  async loadSettings() {
    try {
      const settings = await ReminderSettings.findOne();
      if (settings) {
        this.settings = {
          reminderGap: settings.reminderGap,
          reminderTime: settings.reminderTime,
          isActive: settings.isActive,
          birthdayWishTime: settings.birthdayWishTime || '11:00',
          birthdayWishesActive: settings.birthdayWishesActive !== false
        };
      }
    } catch (error) {
      // Error loading reminder settings
    }
  }

  // Update settings
  async updateSettings(newSettings) {
    try {
      this.settings = {
        reminderGap: newSettings.reminderGap,
        reminderTime: newSettings.reminderTime,
        isActive: newSettings.isActive,
        birthdayWishTime: newSettings.birthdayWishTime || this.settings.birthdayWishTime,
        birthdayWishesActive: newSettings.birthdayWishesActive !== false
      };
      
      // Reschedule if service is running
      if (this.isRunning) {
        this.stop();
        await this.start();
      }
    } catch (error) {
      // Error updating reminder settings
    }
  }

  // Start automatic reminder service
  async start() {
    if (this.isRunning) {
      return;
    }
    
    // Load settings from database
    await this.loadSettings();
    
    this.isRunning = true;

    // Run immediately on start
    await this.runReminders();

    // Schedule daily runs using cron
    this.scheduleDailyReminders();
    
    // Schedule birthday wishes using cron
    this.scheduleBirthdayWishes();
  }

  // Stop automatic reminder service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    // Stop all cron jobs
    cron.getTasks().forEach(task => task.stop());
    this.isRunning = false;
  }

  // Schedule daily reminders based on settings using cron
  scheduleDailyReminders() {
    // Parse time from settings (e.g., "10:00" -> 10 hours, 0 minutes)
    const [hours, minutes] = this.settings.reminderTime.split(':').map(Number);
    
    // Convert IST to UTC: 10:00 AM IST = 4:30 AM UTC (IST is UTC+5:30)
    const utcHours = (hours - 5) % 24; // Subtract 5 hours for UTC
    const utcMinutes = (minutes - 30) % 60; // Subtract 30 minutes for UTC
    
    // Handle negative minutes
    const finalUtcHours = utcMinutes < 0 ? (utcHours - 1 + 24) % 24 : utcHours;
    const finalUtcMinutes = utcMinutes < 0 ? utcMinutes + 60 : utcMinutes;
    
    console.log(`⏰ Scheduling fee reminders for ${hours}:${minutes.toString().padStart(2, '0')} AM IST (${finalUtcHours}:${finalUtcMinutes.toString().padStart(2, '0')} AM UTC) daily`);
    
    // Schedule using cron
    cron.schedule(`${finalUtcMinutes} ${finalUtcHours} * * *`, async () => {
      console.log(`⏰ ${hours}:${minutes.toString().padStart(2, '0')} AM IST - Running automatic fee reminders...`);
      await this.runReminders();
    }, {
      scheduled: true,
      timezone: "UTC" // Use UTC timezone for consistent scheduling
    });
  }

  // Schedule birthday wishes based on settings using cron
  scheduleBirthdayWishes() {
    if (!this.settings.birthdayWishesActive) {
      console.log('🎂 Birthday wishes are disabled in settings');
      return;
    }
    
    // Parse time from settings (e.g., "11:00" -> 11 hours, 0 minutes)
    const [hours, minutes] = this.settings.birthdayWishTime.split(':').map(Number);
    
    // Convert IST to UTC: 11:00 AM IST = 5:30 AM UTC (IST is UTC+5:30)
    const utcHours = (hours - 5) % 24; // Subtract 5 hours for UTC
    const utcMinutes = (minutes - 30) % 60; // Subtract 30 minutes for UTC
    
    // Handle negative minutes
    const finalUtcHours = utcMinutes < 0 ? (utcHours - 1 + 24) % 24 : utcHours;
    const finalUtcMinutes = utcMinutes < 0 ? utcMinutes + 60 : utcMinutes;
    
    console.log(`🎂 Scheduling birthday wishes for ${hours}:${minutes.toString().padStart(2, '0')} AM IST (${finalUtcHours}:${finalUtcMinutes.toString().padStart(2, '0')} AM UTC) daily`);
    
    // Schedule using cron
    cron.schedule(`${finalUtcMinutes} ${finalUtcHours} * * *`, async () => {
      console.log(`🎂 ${hours}:${minutes.toString().padStart(2, '0')} AM IST - Running automatic birthday wishes...`);
      await this.runBirthdayWishes();
    }, {
      scheduled: true,
      timezone: "UTC" // Use UTC timezone for consistent scheduling
    });
  }

  // Fix invalid due dates in database
  async fixInvalidDueDates() {
    try {
      console.log('🔧 Fixing invalid due dates in database...');
      
      const students = await Student.find({ 
        "enquiryType": "Admission",
        "installments.paid": false
      });
      
      let fixedCount = 0;
      
      for (const student of students) {
        let needsUpdate = false;
        const updatedInstallments = student.installments.map(inst => {
          if (!inst.paid && inst.amount > 0) {
            // Check if due date is invalid
            if (!inst.dueDate || inst.dueDate === 'Invalid Date' || isNaN(new Date(inst.dueDate).getTime())) {
              // Calculate new due date based on admission date
              const admissionDate = new Date(student.date);
              const newDueDate = new Date(admissionDate);
              newDueDate.setDate(admissionDate.getDate() + 30); // 30 days after admission
              
              needsUpdate = true;
              fixedCount++;
              
              return {
                ...inst,
                dueDate: newDueDate.toISOString().split('T')[0]
              };
            }
          }
          return inst;
        });
        
        if (needsUpdate) {
          await Student.findByIdAndUpdate(student._id, {
            installments: updatedInstallments
          });
        }
      }
      
      console.log(`✅ Fixed ${fixedCount} invalid due dates`);
      return fixedCount;
    } catch (error) {
      console.error('❌ Error fixing due dates:', error.message);
      return 0;
    }
  }

  // Run automatic reminders
  async runReminders() {
    try {
      console.log('💰 Starting automatic fee reminder service...');
      
      // Use the SAME logic as frontend getPendingInstallments
      const now = new Date();
      const in30Days = new Date(now);
      in30Days.setDate(now.getDate() + 30);

      console.log(`📅 Checking for pending installments on ${now.toDateString()}...`);
      
      // Fix invalid due dates first
      await this.fixInvalidDueDates();

      // Get ALL students with unpaid installments (only Admission students, not Enquiry)
       // Don't filter by year - check all students from all years
               const students = await Student.find({ 
          "enquiryType": "Admission" // Only show Admission students, not Enquiry
        })
          .populate("selectedCourses", "name")
          .select("name selectedCourses installments paymentHistory date studentId contactNo phone lastReminderDate nextReminderDate reminderCount enquiryType")
          .lean(); // Use lean() for better performance

             console.log(`👥 Total Admission Students: ${students.length}`);
       
       

      const pendingStudents = [];

      // Process each student - only include if they have pending payments
      const eligibleStudents = [];
      let skippedRecentPayment = 0;
      let skippedReminderGap = 0;
      let noValidPhone = 0;
      
      students.forEach(student => {
        let hasPendingInstallments = false;
        let shouldSkipStudent = false;
        
        // Check if student made recent payment within 7 days of due date
        // Use admission date or last payment date for comparison
        const referenceDate = this.getReferenceDate(student);
        const hasRecentPayment = this.checkRecentPayment(student, referenceDate);
        
        if (hasRecentPayment) {
          shouldSkipStudent = true;
          skippedRecentPayment++;
        }
        
        // Check if reminder was sent within last 2 days
        const shouldSendReminder = this.shouldSendReminder(student);
        
        if (!shouldSendReminder) {
          shouldSkipStudent = true;
          skippedReminderGap++;
        }
        
                 // Only process if student should not be skipped
         if (!shouldSkipStudent) {
           let hasPendingInstallments = false;
           
                       // Check if student has any unpaid installments with due amounts
                         student.installments.forEach((inst, index) => {
               if (!inst.paid && inst.amount && inst.amount > 0) {
                 // Get reference date (admission date or last payment date)
                 const referenceDate = this.getReferenceDate(student);
                 
                 // Calculate due date based on installment number (monthly)
                 let dueDate = new Date(referenceDate);
                 
                 // If installment has a specific due date, use that instead
                 if (inst.dueDate && inst.dueDate !== 'Invalid Date') {
                   const instDueDate = new Date(inst.dueDate);
                   if (!isNaN(instDueDate.getTime())) {
                     dueDate = instDueDate;
                   } else {
                     // Invalid due date, calculate based on installment number
                     dueDate.setMonth(dueDate.getMonth() + index + 1); // +1 because first installment is next month
                   }
                 } else {
                   // No due date set, calculate based on installment number
                   dueDate.setMonth(dueDate.getMonth() + index + 1); // +1 because first installment is next month
                 }
                 
                 // Calculate gap from due date
                 const daysDiff = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
                 const monthsDiff = Math.floor(daysDiff / 30);
                
                let status = null;
                // Only count if due date is in the past (overdue)
                if (daysDiff > 60) {
                  status = `Overdue ${monthsDiff}+ months`; // 🔴 Overdue 2+ months
                } else if (daysDiff > 0) {
                  status = `Due ${monthsDiff}+ months`; // 🟡 Due X+ months
                }
                // Remove "Due Soon" for future dates - only count overdue

                               // Only add to pending students if due date is in the past (overdue)
                if (status && daysDiff > 0) {
                  // Check for valid phone number (try contactNo first, then phone)
                  const studentPhone = student.contactNo || student.phone;
                  const formattedPhone = this.validateAndFormatPhone(studentPhone);
                  
                  if (formattedPhone) {
                    hasPendingInstallments = true;
                    pendingStudents.push({
                      id: `${student._id}_${index}`,
                      studentName: student.name,
                      studentId: student.studentId,
                      contactNo: formattedPhone, // Use formatted phone number
                      courseNames: student.selectedCourses.map(c => c.name),
                      amount: inst.amount,
                      dueDate: inst.dueDate,
                      status: status,
                      daysPastDue: daysDiff,
                      monthsPastDue: monthsDiff,
                      _id: student._id,
                      lastReminderDate: student.lastReminderDate,
                      nextReminderDate: student.nextReminderDate,
                      reminderCount: student.reminderCount
                    });
                  } else {
                    noValidPhone++;
                    console.log(`⚠️  Student ${student.studentId} skipped - no valid phone number (contactNo: ${student.contactNo}, phone: ${student.phone})`);
                  }
                }
             }
           });
           
           // Only add to eligible students if they have pending installments
           if (hasPendingInstallments) {
             eligibleStudents.push(student);
           }
         }
      });
      
             
      
             
      
             if (pendingStudents.length === 0) {
         console.log('✅ No students eligible for reminders today');
         this.lastRunDate = new Date();
         return;
       }

      // Check if WhatsApp is ready
      if (!whatsappConnectionService.isReady) {
        console.log('❌ WhatsApp is not connected, skipping fee reminders');
        this.lastRunDate = new Date();
        return;
      }

             console.log(`📱 Sending reminders to ${pendingStudents.length} eligible students...`);

      // Send WhatsApp reminders
      try {
        const result = await this.sendFeeReminders(pendingStudents);
        
        // Initialize counters
        let successCount = 0;
        let failureCount = 0;
        let skippedCount = 0;
        
        if (result.success) {
          successCount = result.results.filter(r => r.status === 'sent').length;
          failureCount = result.results.filter(r => r.status === 'failed').length;
          skippedCount = result.results.filter(r => r.status === 'skipped').length;
          
                     console.log(`📱 Reminder Results: ${successCount} sent, ${failureCount} failed`);
          
                     // Update last reminder date for successful sends
           if (successCount > 0) {
             await this.updateLastReminderDate(pendingStudents);
           }
                 } else {
           console.log('❌ Failed to send reminders');
           failureCount = pendingStudents.length;
         }
        
        
        
                 // Log to file for tracking
         const logEntry = {
           date: now.toISOString(),
           type: 'fee_reminders',
           total_students: students.length,
           skipped_recent_payment: skippedRecentPayment,
           skipped_reminder_gap: skippedReminderGap,
           no_valid_phone: noValidPhone,
           eligible_students: eligibleStudents.length,
           attempted: pendingStudents.length,
           successful: successCount,
           failed: failureCount,
           skipped: skippedCount,
           success_rate: pendingStudents.length > 0 ? Math.round((successCount / pendingStudents.length) * 100) : 0
         };
         
         console.log('📝 Log entry:', JSON.stringify(logEntry, null, 2));
         
         // Save to log file
         try {
           const logger = (await import('../utils/logger.js')).default;
           logger.logFeeReminders(logEntry);
         } catch (logError) {
           console.error('Failed to save log:', logError.message);
           // Continue execution even if logging fails
         }
        
      } catch (error) {
                 console.error('❌ Error sending reminders:', error.message);
        
        
      }
      
      this.lastRunDate = new Date();
      
    } catch (error) {
      console.error('❌ Error in automatic reminders:', error.message);
    }
  }

  // Get reference date for comparison (admission date or last payment date)
  getReferenceDate(student) {
    try {
      // If student has payment history, use last payment date
      if (student.paymentHistory && student.paymentHistory.length > 0) {
                 // Find the most recent payment date (check both date and paymentDate fields)
         const lastPayment = student.paymentHistory.reduce((latest, payment) => {
           const paymentDate = new Date(payment.paymentDate || payment.date);
           const latestDate = new Date(latest.paymentDate || latest.date);
           return paymentDate > latestDate ? payment : latest;
         });
         
         return new Date(lastPayment.paymentDate || lastPayment.date);
      }
      
      // If no payment history, use admission date
      if (student.date) {
        return new Date(student.date);
      }
      
      // Fallback to current date
      return new Date();
    } catch (error) {
      return new Date();
    }
  }

  // Check if student made recent payment within 7 days of due date
  checkRecentPayment(student, referenceDate) {
    try {
      if (!student.paymentHistory || student.paymentHistory.length === 0) {
        return false;
      }

      const referenceDatePlus7 = new Date(referenceDate);
      referenceDatePlus7.setDate(referenceDatePlus7.getDate() + 7);

      // Check if any payment was made within 7 days of reference date
      const hasRecentPayment = student.paymentHistory.some(payment => {
        const paymentDate = new Date(payment.paymentDate || payment.date);
        return paymentDate >= referenceDate && paymentDate <= referenceDatePlus7;
      });

      return hasRecentPayment;
    } catch (error) {
      return false;
    }
  }

  // Send fee reminders using new message service
  async sendFeeReminders(students) {
    try {
      console.log(`📱 Sending fee reminders to ${students.length} students...`);
      
      if (!whatsappConnectionService.isReady) {
        throw new Error('WhatsApp client is not ready');
      }

      const results = [];
      
      for (const student of students) {
        try {
          const message = this.createReminderMessage(student);
          
          // Format phone number with +91 prefix
          let phoneNumber = student.contactNo.replace(/\D/g, ''); // Remove non-digits
          
          // Remove +91 if already present
          if (phoneNumber.startsWith('91')) {
            phoneNumber = phoneNumber.substring(2);
          }
          
          // Add +91 prefix
          phoneNumber = `+91${phoneNumber}`;
          
          console.log(`📱 Sending reminder to student ${student.studentId}`);
          
          const result = await whatsappMessageService.sendMessage(phoneNumber, message);
          
          results.push({
            studentId: student.studentId,
            studentName: student.name,
            contactNo: phoneNumber,
            status: 'sent',
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Reminder sent to student ${student.studentId}`);
          
          // Add delay between messages (10 seconds)
          await new Promise(resolve => setTimeout(resolve, 10000));
          
        } catch (error) {
          console.error(`❌ Failed to send reminder to ${student.studentId}:`, error.message);
          
          results.push({
            studentId: student.studentId,
            studentName: student.name,
            contactNo: student.contactNo,
            status: 'failed',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      console.log(`✅ Fee reminders completed: ${results.filter(r => r.status === 'sent').length} sent, ${results.filter(r => r.status === 'failed').length} failed`);
      
      return {
        success: true,
        message: 'Fee reminders sent successfully',
        results: results,
        sent: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status === 'failed').length
      };
      
    } catch (error) {
      console.error('❌ Error sending fee reminders:', error);
      return {
        success: false,
        message: error.message,
        results: []
      };
    }
  }

  // Create reminder message
  createReminderMessage(student) {
    try {
      const courseNames = student.selectedCourses?.map(course => course.name || course).join(', ') || 'Selected Courses';
      const pendingAmount = student.totalDue || student.totalFees || 0;
      
      const message = `🔔 *Fee Reminder - TCIT*

Dear ${student.name},

This is a friendly reminder that your fee payment of ₹${pendingAmount.toLocaleString('en-IN')} for ${courseNames} is pending.

*Student Details:*
• Student ID: ${student.studentId}
• Course: ${courseNames}
• Pending Amount: ₹${pendingAmount.toLocaleString('en-IN')}

Please complete your payment at the earliest to avoid any inconvenience.

For any queries, please contact us.

*TCIT - Talent Computer Institute*
📞 Contact: +91-XXXXXXXXXX
📍 Address: Your Address Here

Thank you for choosing TCIT! 🎓`;

      return message;
    } catch (error) {
      console.error('Error creating reminder message:', error);
      return 'Fee reminder message';
    }
  }

  // Check if reminder should be sent (dynamic gap rule based on settings)
  shouldSendReminder(student) {
    try {
      if (!student.lastReminderDate) {
        return true; // No previous reminder, can send
      }

      const lastReminder = new Date(student.lastReminderDate);
      const now = new Date();
      const daysSinceLastReminder = Math.floor((now - lastReminder) / (1000 * 60 * 60 * 24));

      // Send reminder only if configured gap days have passed since last reminder
      return daysSinceLastReminder >= this.settings.reminderGap;
    } catch (error) {
      return true; // Default to sending if error
    }
  }

  // Update last reminder date for students
  async updateLastReminderDate(students) {
    try {
      const now = new Date();
      
      for (const student of students) {
        await Student.findByIdAndUpdate(student._id, {
          lastReminderDate: now,
          $inc: { reminderCount: 1 }
        });
      }
      
      // Updated last reminder date for students
    } catch (error) {
      // Error updating last reminder date
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunDate: this.lastRunDate,
      nextRunDate: this.getNextRunDate(),
      settings: this.settings
    };
  }

  // Get next scheduled run date
  getNextRunDate() {
    if (!this.isRunning) return null;
    
    const now = new Date();
    const nextRun = new Date();
    
    // Parse time from settings
    const [hours, minutes] = this.settings.reminderTime.split(':').map(Number);
    nextRun.setHours(hours, minutes, 0, 0);

    if (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes)) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  // Manual trigger for testing
  async triggerNow() {
    console.log('🚀 Manual trigger - Running fee reminders now...');
    await this.runReminders();
  }

  // Manual birthday wishes trigger
  async triggerBirthdayWishes() {
    console.log('🎂 Manual trigger - Running birthday wishes now...');
    await this.runBirthdayWishes();
  }

  // Run birthday wishes
  async runBirthdayWishes() {
    try {
      console.log('🎂 Starting automatic birthday wishes...');
      
      // Import and run birthday wishes
      const automaticBirthdayWishes = (await import('./automaticBirthdayWishes.js')).default;
      await automaticBirthdayWishes.sendAutomaticBirthdayWishes();
      
    } catch (error) {
      console.error('❌ Error in birthday wishes:', error.message);
    }
  }

  // Get detailed status for debugging
  async getDetailedStatus() {
    try {
      const now = new Date();
      const students = await Student.find({ 
        "enquiryType": "Admission"
      })
        .populate("selectedCourses", "name")
        .select("name selectedCourses installments paymentHistory date studentId contactNo phone lastReminderDate nextReminderDate reminderCount enquiryType")
        .lean();

      const status = {
        totalStudents: students.length,
        eligibleStudents: 0,
        validPhones: 0,
        invalidPhones: 0,
        pendingFees: 0,
        lastRun: this.lastRunDate,
        nextRun: this.getNextRunDate(),
        settings: this.settings
      };

      students.forEach(student => {
        let hasPendingFees = false;
        
        if (student.installments && student.installments.length > 0) {
          student.installments.forEach(inst => {
            if (!inst.paid && inst.amount && inst.amount > 0) {
              hasPendingFees = true;
              status.pendingFees++;
            }
          });
        }
        
        if (hasPendingFees) {
          status.eligibleStudents++;
          
          const studentPhone = student.contactNo || student.phone;
          const formattedPhone = this.validateAndFormatPhone(studentPhone);
          
          if (formattedPhone) {
            status.validPhones++;
          } else {
            status.invalidPhones++;
          }
        }
      });

      return status;
    } catch (error) {
      console.error('Error getting detailed status:', error.message);
      return null;
    }
  }
}

// Create singleton instance
const automaticReminderService = new AutomaticReminderService();

export default automaticReminderService;
