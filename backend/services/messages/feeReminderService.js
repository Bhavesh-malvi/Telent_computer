import whatsappMessageService from '../whatsapp/core/messageService.js';
import Student from '../../Model/Student.js';

class FeeReminderService {
  constructor() {
    this.messageService = whatsappMessageService;
  }

  // Get students with pending fees based on FINAL CORRECT logic (30+ days requirement)
  async getStudentsWithPendingFees() {
    try {
      console.log('📊 Fetching students with pending fees (FINAL LOGIC - 30+ DAYS)...');
      
      // Get auto message settings for reminder gap
      const AutoMessageSettings = (await import('../../Model/AutoMessageSettings.js')).default;
      const settings = await AutoMessageSettings.getSettings();
      
      console.log(`⚙️ Using settings: Fee Reminder Gap = ${settings.feeReminderGapDays} days`);
      
      // Find students with pending fees and proper contact numbers
      const students = await Student.find({ 
        "contactNo": { $exists: true, $ne: null, $ne: "" },
        "enquiryType": "Admission",
        "status": "active"
      })
      .populate("selectedCourses", "name")
      .select("name selectedCourses installments paymentHistory date studentId contactNo lastReminderDate nextReminderDate reminderCount enquiryType totalFees totalDue");

      console.log(`📊 Found ${students.length} students with contact numbers`);

      const pendingStudents = [];

      // Process each student with FINAL LOGIC
      for (const student of students) {
        const studentData = await this.calculateStudentPaymentStatusFinal(student, settings);
        
        if (studentData.shouldSendReminder) {
          pendingStudents.push(studentData);
        }
      }

      console.log(`📊 Processed ${pendingStudents.length} students eligible for fee reminders (30+ days requirement)`);
      return pendingStudents;

    } catch (error) {
      console.error('❌ Error fetching students with pending fees:', error);
      throw error;
    }
  }

  // Calculate payment status for a student with FINAL CORRECT logic (30+ days requirement)
  async calculateStudentPaymentStatusFinal(student, settings) {
    try {
      const currentDate = new Date();
      let daysGap = 0;
      let referenceDate = null;
      let referenceType = '';

      // FINAL LOGIC: Check if student has payment history
      if (student.paymentHistory && student.paymentHistory.length > 0) {
        // If student has made payments, check gap from last payment
        const sortedPayments = student.paymentHistory.sort((a, b) => 
          new Date(b.paymentDate) - new Date(a.paymentDate)
        );
        referenceDate = new Date(sortedPayments[0].paymentDate);
        referenceType = 'Last Payment';
        daysGap = Math.floor((currentDate - referenceDate) / (1000 * 60 * 60 * 24));
      } else {
        // If no payments, check gap from admission date (date field)
        if (student.date) {
          referenceDate = new Date(student.date);
          referenceType = 'Admission Date';
          daysGap = Math.floor((currentDate - referenceDate) / (1000 * 60 * 60 * 24));
        } else {
          return {
            student,
            shouldSendReminder: false,
            reason: 'No admission date found'
          };
        }
      }

      // Calculate fees - FINAL LOGIC
      let totalFees = 0;
      let paidFees = 0;

      // Check if student has totalFees field
      if (student.totalFees) {
        totalFees = parseFloat(student.totalFees) || 0;
      } else {
        // Calculate from selectedCourses
        student.selectedCourses.forEach(course => {
          if (course.fees) {
            totalFees += parseFloat(course.fees) || 0;
          }
          if (course.paidFees) {
            paidFees += parseFloat(course.paidFees) || 0;
          }
        });
      }

      // Check if student has totalDue field
      let pendingFees = 0;
      if (student.totalDue !== undefined) {
        pendingFees = parseFloat(student.totalDue);
      } else {
        pendingFees = totalFees - paidFees;
      }

      // FINAL LOGIC: Check if pending fees is 0 or negative
      if (pendingFees <= 0) {
        return {
          student,
          shouldSendReminder: false,
          reason: `No pending fees (due: ₹${pendingFees})`
        };
      }

      // FINAL LOGIC: Check if eligible based on 30+ days requirement
      if (daysGap < 30) {
        return {
          student,
          shouldSendReminder: false,
          reason: `Gap too small: ${daysGap} days (need 30+ days for eligibility)`
        };
      }

      // FINAL LOGIC: Check manual reminder gap for frequency (from last reminder date)
      if (student.lastReminderDate) {
        const lastReminderDate = new Date(student.lastReminderDate);
        const daysSinceLastReminder = Math.floor((currentDate - lastReminderDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastReminder < settings.feeReminderGapDays) {
          return {
            student,
            shouldSendReminder: false,
            reason: `Reminder gap too small: ${daysSinceLastReminder} days since last reminder (need ${settings.feeReminderGapDays} days for next reminder)`
          };
        }
      }

      // Determine due status based on gap
      let dueStatus = '';
      if (daysGap >= 60) {
        dueStatus = '2+ months due';
      } else if (daysGap >= 30) {
        dueStatus = '1+ month due';
      } else {
        dueStatus = 'Less than 1 month';
      }

      return {
        student,
        shouldSendReminder: true,
        dueStatus,
        daysGap,
        pendingFees,
        referenceType,
        referenceDate: referenceDate && !isNaN(referenceDate.getTime()) ? referenceDate.toISOString().split('T')[0] : 'Invalid Date',
        reason: `ELIGIBLE - ${dueStatus} (${daysGap} days gap)`,
        // Add required fields for message creation
        studentName: student.name,
        studentId: student.studentId,
        contactNo: student.contactNo,
        courseNames: student.selectedCourses.map(course => course.name),
        pendingAmount: pendingFees,
        monthsDue: Math.floor(daysGap / 30)
      };

    } catch (error) {
      console.error(`❌ Error calculating payment status for ${student.name}:`, error);
      return {
        student,
        shouldSendReminder: false,
        reason: `Error: ${error.message}`
      };
    }
  }

  // Create reminder message based on due status
  createReminderMessage(studentData) {
    const courseNames = studentData.courseNames.join(', ');
    const pendingAmount = studentData.pendingAmount;
    const dueStatus = studentData.dueStatus;
    const monthsDue = studentData.monthsDue || 0;
    
    // Select template based on months due
    if (monthsDue >= 2) {
      return this.getStrictTemplate(studentData, courseNames, pendingAmount, dueStatus);
    } else {
      return this.getFriendlyTemplate(studentData, courseNames, pendingAmount, dueStatus);
    }
  }

  // Get friendly template (1 month or less overdue)
  getFriendlyTemplate(studentData, courseNames, pendingAmount, dueStatus) {
    const templates = [
      `PAYMENT REMINDER

Dear ${studentData.studentName},

Hope you're doing well! 🌟

This is a friendly reminder about your pending fee payment.

📚 Course: ${courseNames}
💰 Pending Amount: ₹${pendingAmount}
📅 Status: ${dueStatus}

We understand that sometimes payments can be delayed due to various reasons. Please complete your payment at your earliest convenience.

If you have any concerns or need assistance, feel free to reach out to us.

Thank you for your cooperation! 😊

Best regards,
TCIT Team`,

      `PAYMENT REMINDER

Hello ${studentData.studentName}! 👋

We hope your learning journey is going great! 

Just a quick reminder about your pending fee payment:

📚 Course: ${courseNames}
💰 Pending Amount: ₹${pendingAmount}
📅 Status: ${dueStatus}

We're here to support your educational goals. Please complete your payment to continue your learning without any interruptions.

Need help? We're just a message away! 💬

Thanks,
TCIT Team`
    ];

    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  // Get strict template (2+ months overdue)
  getStrictTemplate(studentData, courseNames, pendingAmount, dueStatus) {
    const templates = [
      `PAYMENT REMINDER

Dear ${studentData.studentName},

⚠️ URGENT: Fee Payment Overdue

Your payment has been pending for ${studentData.monthsDue}+ months.

📚 Course: ${courseNames}
💰 Pending Amount: ₹${pendingAmount}
📅 Status: ${dueStatus}

This is a final reminder. Please complete your payment immediately to avoid any account restrictions.

Contact us immediately if you have any issues.

TCIT Team`,

      `PAYMENT REMINDER

Dear ${studentData.studentName},

🚨 FINAL NOTICE: Payment Required

Your fee payment is significantly overdue.

📚 Course: ${courseNames}
💰 Pending Amount: ₹${pendingAmount}
📅 Status: ${dueStatus}

Please settle your payment immediately to avoid any disruptions to your account.

TCIT Team`
    ];

    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  // Send fee reminders
  async sendFeeReminders() {
    try {
      console.log('📱 Starting fee reminder service...');
      
      if (!this.messageService.isReady()) {
        throw new Error('WhatsApp message service is not ready');
      }

      const pendingStudents = await this.getStudentsWithPendingFees();
      
      if (pendingStudents.length === 0) {
        console.log('ℹ️ No students eligible for fee reminders');
        return {
          success: true,
          message: 'No students eligible for fee reminders',
          results: []
        };
      }

      console.log(`📱 Sending fee reminders to ${pendingStudents.length} students...`);

      const messages = [];
      const results = [];

      // Prepare messages
      for (const studentData of pendingStudents) {
        const message = this.createReminderMessage(studentData);
        messages.push({
          phoneNumber: studentData.contactNo,
          message: message,
          studentId: studentData.studentId,
          studentName: studentData.studentName
        });
      }

      // Send messages
      const sendResult = await this.messageService.sendBulkMessages(messages, {
        delayBetweenMessages: 3000, // 3 seconds delay
        maxRetries: 3
      });

      // Update student records
      for (let i = 0; i < pendingStudents.length; i++) {
        const studentData = pendingStudents[i];
        const messageResult = sendResult.results[i];
        
        if (messageResult.success) {
          // Update last reminder date
          await Student.findByIdAndUpdate(studentData.student._id, {
            $set: {
              lastReminderDate: new Date(),
              nextReminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            },
            $inc: { reminderCount: 1 }
          });
        }

        results.push({
          studentId: studentData.studentId,
          studentName: studentData.studentName,
          contactNo: studentData.contactNo,
          courseNames: studentData.courseNames,
          pendingAmount: studentData.pendingAmount,
          dueStatus: studentData.dueStatus,
          monthsDue: studentData.monthsDue,
          messageResult: messageResult
        });
      }

      const successCount = results.filter(r => r.messageResult.success).length;
      const failureCount = results.filter(r => !r.messageResult.success).length;

      console.log(`✅ Fee reminders completed: ${successCount} sent, ${failureCount} failed`);

      return {
        success: true,
        message: `Fee reminders sent to ${pendingStudents.length} students`,
        totalStudents: pendingStudents.length,
        successfulMessages: successCount,
        failedMessages: failureCount,
        results: results
      };

    } catch (error) {
      console.error('❌ Error sending fee reminders:', error);
      throw error;
    }
  }

  // Get service status
  getStatus() {
    return {
      serviceName: 'Fee Reminder Service',
      messageServiceReady: this.messageService.isReady(),
      lastRun: new Date().toISOString()
    };
  }
}

// Create singleton instance
const feeReminderService = new FeeReminderService();

export default feeReminderService;
