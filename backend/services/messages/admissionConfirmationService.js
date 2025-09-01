import whatsappMessageService from '../whatsapp/core/messageService.js';
import Student from '../../Model/Student.js';

class AdmissionConfirmationService {
  constructor() {
    this.messageService = whatsappMessageService;
  }

  // ✅ Safe message sending with number validation
  async safeSendMessage(contactNo, message, options = {}) {
    try {
      console.log(`🔍 Validating number: ${contactNo.replace(/(\d{4})(\d{4})(\d{3})/, '$1****$3')}`);
      
      const client = this.messageService.connectionService.getClient();
      if (!client) {
        throw new Error('WhatsApp client not available');
      }

      // Clean and format number
      let phone = contactNo.toString().replace(/\D/g, "");
      if (phone.length === 10) {
        phone = "91" + phone; // default India
      }

      // Validate number with WhatsApp
      const numberId = await client.getNumberId(phone);
      if (!numberId) {
        console.error(`❌ Number ${phone} is not registered on WhatsApp`);
        return { 
          success: false, 
          error: "Number is not registered on WhatsApp",
          phoneNumber: phone
        };
      }

      console.log(`✅ Number validated: ${numberId._serialized}`);
      
      // Send message using validated numberId
      const result = await this.messageService.sendMessage(contactNo, message, options);
      return result;
      
    } catch (err) {
      console.error(`❌ Error in safeSendMessage:`, err);
      return { 
        success: false, 
        error: err.message,
        phoneNumber: contactNo
      };
    }
  }

  // Get new admissions (students admitted today) with proper date logic
  async getNewAdmissions() {
    try {
      console.log('🎓 Fetching new admissions...');
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      console.log(`🎓 Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
      
      // Find students admitted today with proper conditions
      const students = await Student.find({
        "contactNo": { $exists: true, $ne: null, $ne: "" },
        "enquiryType": "Admission",
        "date": { $gte: startOfDay, $lte: endOfDay }
      })
      .populate("selectedCourses", "name")
      .select("name date selectedCourses studentId contactNo enquiryType totalFees")
      .sort({ date: -1 }); // Most recent first

      console.log(`🎓 Found ${students.length} new admissions today`);
      
      // Log admission count only
      console.log(`🎓 Found ${students.length} new admissions today`);

      return students;

    } catch (error) {
      console.error('❌ Error fetching new admissions:', error);
      throw error;
    }
  }

  // Alternative method to get admissions from last 24 hours
  async getNewAdmissionsLast24Hours() {
    try {
      console.log('🎓 Fetching new admissions from last 24 hours...');
      
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      
      console.log(`🎓 Time range: ${twentyFourHoursAgo.toISOString()} to ${now.toISOString()}`);
      
      const students = await Student.find({
        "contactNo": { $exists: true, $ne: null, $ne: "" },
        "enquiryType": "Admission",
        "date": { $gte: twentyFourHoursAgo, $lte: now }
      })
      .populate("selectedCourses", "name")
      .select("name date selectedCourses studentId contactNo enquiryType totalFees")
      .sort({ date: -1 });

      console.log(`🎓 Found ${students.length} new admissions in last 24 hours`);
      
      // Log admission count only
      console.log(`🎓 Found ${students.length} new admissions in last 24 hours`);

      return students;

    } catch (error) {
      console.error('❌ Error fetching recent admissions:', error);
      throw error;
    }
  }

  // Create admission confirmation message
  createAdmissionMessage(student) {
    const courseNames = student.selectedCourses?.map(c => c.name)?.join(', ') || 'Course';
    const totalFees = student.totalFees || 0;
    const admissionDate = new Date(student.date).toLocaleDateString('en-IN');
    
    const templates = [
      `🎓 WELCOME TO TCIT! 🎓

Dear ${student.name},

Welcome to TCIT! We're excited to have you join our learning community! 🎉

📚 Course: ${courseNames}
📅 Admission Date: ${admissionDate}
💰 Total Fees: ₹${totalFees}

Your educational journey starts now! Here's what you can expect:
🌟 Quality education and training
📖 Comprehensive course materials
👨‍🏫 Expert instructors
💻 Hands-on practical sessions
📱 Regular updates and support

We're here to support your success every step of the way! 

If you have any questions, feel free to reach out to us.

Best regards,
TCIT Team`,

      `🎉 WELCOME ABOARD! 🎉

Hello ${student.name}! 👋

Congratulations on joining TCIT! We're thrilled to have you with us! 🎓

📚 Course: ${courseNames}
📅 Admission Date: ${admissionDate}
💰 Total Fees: ₹${totalFees}

Your learning adventure begins! You'll have access to:
✨ Interactive learning sessions
📚 Comprehensive study materials
👨‍🏫 Experienced faculty
💻 Practical training
📱 24/7 support

We're committed to your success! 🚀

Welcome to the TCIT family! 

Best wishes,
TCIT Team`,

      `🎓 ADMISSION CONFIRMED! 🎓

Dear ${student.name},

Your admission to TCIT has been confirmed! Welcome to our institution! 🎉

📚 Course: ${courseNames}
📅 Admission Date: ${admissionDate}
💰 Total Fees: ₹${totalFees}

You're now part of our learning community! We provide:
🌟 Industry-relevant curriculum
📖 Updated course content
👨‍🏫 Qualified instructors
💻 Practical experience
📱 Continuous support

Your success is our priority! 

Welcome to TCIT! 🎊

Best regards,
TCIT Team`
    ];

    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  // Send admission confirmations
  async sendAdmissionConfirmations() {
    try {
      console.log('🎓 Starting admission confirmation service...');
      
      if (!this.messageService.isReady()) {
        throw new Error('WhatsApp message service is not ready');
      }

      // Try today's admissions first, fallback to last 24 hours
      let newAdmissions = [];
      try {
        newAdmissions = await this.getNewAdmissions();
        if (newAdmissions.length === 0) {
          console.log('ℹ️ No admissions today, checking last 24 hours...');
          newAdmissions = await this.getNewAdmissionsLast24Hours();
        }
      } catch (error) {
        console.log('⚠️ Today method failed, trying last 24 hours...');
        newAdmissions = await this.getNewAdmissionsLast24Hours();
      }
      
      if (newAdmissions.length === 0) {
        console.log('ℹ️ No new admissions found');
        return {
          success: true,
          message: 'No new admissions found',
          results: []
        };
      }

      console.log(`🎓 Sending admission confirmations to ${newAdmissions.length} students...`);

      const messages = [];
      const results = [];

      // Prepare messages
      for (const student of newAdmissions) {
        const message = this.createAdmissionMessage(student);
        messages.push({
          phoneNumber: student.contactNo,
          message: message,
          studentId: student.studentId,
          studentName: student.name
        });
      }

      // Send messages
      const sendResult = await this.messageService.sendBulkMessages(messages, {
        delayBetweenMessages: 2000, // 2 seconds delay
        maxRetries: 3
      });

      // Process results
      for (let i = 0; i < newAdmissions.length; i++) {
        const student = newAdmissions[i];
        const messageResult = sendResult.results[i];
        
        results.push({
          studentId: student.studentId,
          studentName: student.name,
          contactNo: student.contactNo,
          courseNames: student.selectedCourses?.map(c => c.name) || [],
          admissionDate: student.date,
          totalFees: student.totalFees,
          messageResult: messageResult
        });
      }

      const successCount = results.filter(r => r.messageResult.success).length;
      const failureCount = results.filter(r => !r.messageResult.success).length;

      console.log(`✅ Admission confirmations completed: ${successCount} sent, ${failureCount} failed`);

      return {
        success: true,
        message: `Admission confirmations sent to ${newAdmissions.length} students`,
        totalStudents: newAdmissions.length,
        successfulMessages: successCount,
        failedMessages: failureCount,
        results: results
      };

    } catch (error) {
      console.error('❌ Error sending admission confirmations:', error);
      throw error;
    }
  }

  // Send admission confirmation for specific student
  async sendAdmissionConfirmation(studentId) {
    try {
      console.log(`🎓 Sending admission confirmation for student`);
      
      if (!this.messageService.isReady()) {
        throw new Error('WhatsApp message service is not ready');
      }

      const student = await Student.findById(studentId)
        .populate("selectedCourses", "name")
        .select("name date selectedCourses studentId contactNo enquiryType totalFees");

      if (!student) {
        throw new Error('Student not found');
      }

      if (!student.contactNo) {
        throw new Error('Student contact number not available');
      }

      if (student.enquiryType !== 'Admission') {
        throw new Error('Student is not an admission student');
      }

      const message = this.createAdmissionMessage(student);
      
      // Use safeSendMessage for better error handling
      const result = await this.safeSendMessage(student.contactNo, message, {
        maxRetries: 3
      });

      return {
        success: result.success,
        message: result.success ? 'Admission confirmation sent successfully' : 'Failed to send admission confirmation',
        studentId: student.studentId,
        studentName: student.name,
        contactNo: student.contactNo,
        result: result
      };

    } catch (error) {
      console.error('❌ Error sending admission confirmation:', error);
      throw error;
    }
  }

  // Get service status
  getStatus() {
    return {
      serviceName: 'Admission Confirmation Service',
      messageServiceReady: this.messageService.isReady(),
      lastRun: new Date().toISOString()
    };
  }
}

// Create singleton instance
const admissionConfirmationService = new AdmissionConfirmationService();

export default admissionConfirmationService;
