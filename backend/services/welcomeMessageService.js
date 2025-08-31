import { generateWelcomeMessage } from '../utils/welcomeMessages.js';
import whatsappConnectionService from './whatsapp/core/connectionService.js';
import whatsappMessageService from './whatsapp/core/messageService.js';

class WelcomeMessageService {
  constructor() {
    this.isEnabled = true;
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Send welcome message to newly admitted student
   * @param {Object} student - Student object with all details
   * @returns {Object} Result of message sending
   */
  async sendWelcomeMessage(student) {
    try {
      // Check if service is enabled
      if (!this.isEnabled) {
        console.log('⚠️ Welcome message service is disabled');
        return {
          success: false,
          message: 'Welcome message service is disabled',
          studentId: student.studentId
        };
      }

      // Validate student data
      if (!this.validateStudentData(student)) {
        return {
          success: false,
          message: 'Invalid student data for welcome message',
          studentId: student.studentId
        };
      }

      // Check if WhatsApp is ready
      if (!whatsappConnectionService.isReady) {
        console.log('❌ WhatsApp not ready for welcome message');
        return {
          success: false,
          message: 'WhatsApp not connected',
          studentId: student.studentId
        };
      }

      // Format phone number
      const phoneNumber = this.formatPhoneNumber(student.contactNo || student.phone);
      if (!phoneNumber) {
        return {
          success: false,
          message: 'Invalid phone number',
          studentId: student.studentId
        };
      }

      // Generate course names
      const courseNames = this.getCourseNames(student.selectedCourses);

      // Generate welcome message
      const welcomeMessage = generateWelcomeMessage(student.name, courseNames);

      console.log(`📱 Sending welcome message to student`);

      // Send message with safe validation
      const result = await this.safeSendMessage(phoneNumber, welcomeMessage, student);

      if (result.success) {
        console.log(`✅ Welcome message sent successfully to student`);
      } else {
        console.log(`❌ Failed to send welcome message to student: ${result.message}`);
      }

      return result;

    } catch (error) {
      console.error(`❌ Error sending welcome message to student:`, error.message);
      return {
        success: false,
        message: error.message,
        studentId: student.studentId,
        error: error
      };
    }
  }

  /**
   * Safe message sending with number validation
   * @param {string} phoneNumber - Formatted phone number
   * @param {string} message - Message to send
   * @param {Object} student - Student object for logging
   * @returns {Object} Result of sending
   */
  async safeSendMessage(phoneNumber, message, student) {
    try {
      console.log(`🔍 Validating number: ${phoneNumber}`);
      
      const client = whatsappConnectionService.getClient();
      if (!client) {
        throw new Error('WhatsApp client not available');
      }

      // Clean and format number
      let phone = phoneNumber.toString().replace(/\D/g, "");
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
          phoneNumber: phone,
          studentId: student.studentId
        };
      }

      console.log(`✅ Number validated: ${numberId._serialized}`);
      
      // Send message using validated numberId
      const result = await whatsappMessageService.sendMessage(phoneNumber, message);
      return result;
      
    } catch (err) {
      console.error(`❌ Error in safeSendMessage:`, err);
      return { 
        success: false, 
        error: err.message,
        phoneNumber: phoneNumber,
        studentId: student.studentId
      };
    }
  }

  /**
   * Simple message sending with retry (NO force reconnect)
   * @param {string} phoneNumber - Formatted phone number
   * @param {string} message - Message to send
   * @param {Object} student - Student object for logging
   * @returns {Object} Result of sending
   */
  async simpleSendMessage(phoneNumber, message, student) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${this.retryAttempts} - Sending welcome message to ${student.name}`);

        // Simple direct message sending - NO aggressive checks or force reconnect
        const result = await whatsappMessageService.sendMessage(phoneNumber, message);
        
        console.log(`✅ Message sent successfully to ${student.name} (Message ID: ${result.id.id})`);

        return {
          success: true,
          message: 'Welcome message sent successfully',
          studentId: student.studentId,
          attempt: attempt,
          messageId: result.id.id
        };

      } catch (error) {
        console.log(`⚠️ Attempt ${attempt} failed for ${student.name}: ${error.message}`);

        if (attempt === this.retryAttempts) {
          return {
            success: false,
            message: `Failed after ${this.retryAttempts} attempts: ${error.message}`,
            studentId: student.studentId,
            attempts: attempt,
            error: error.message
          };
        }

        // Wait before retry with exponential backoff
        const delay = this.retryDelay * attempt;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Validate student data for welcome message
   * @param {Object} student - Student object
   * @returns {boolean} Is valid
   */
  validateStudentData(student) {
    console.log('🔍 Validating student data:', {
      hasStudent: !!student,
      name: student?.name,
      studentId: student?.studentId,
      contactNo: student?.contactNo,
      phone: student?.phone,
      selectedCourses: student?.selectedCourses,
      enquiryType: student?.enquiryType
    });

    if (!student) {
      console.log('❌ Student object is null/undefined');
      return false;
    }
    
    if (!student.name) {
      console.log('❌ Student name is missing');
      return false;
    }
    
    // studentId is optional, can be undefined for new admissions
    if (!student.contactNo && !student.phone) {
      console.log('❌ Student contact number is missing');
      return false;
    }
    
    if (!student.selectedCourses || student.selectedCourses.length === 0) {
      console.log('❌ Student selected courses are missing');
      return false;
    }
    
    if (student.enquiryType !== 'Admission') {
      console.log('❌ Student is not an admission student');
      return false;
    }

    console.log('✅ Student data validation passed');
    return true;
  }

  /**
   * Format phone number for WhatsApp
   * @param {string} phone - Phone number
   * @returns {string|null} Formatted phone number
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;

    // Remove all non-digit characters
    let formatted = phone.replace(/\D/g, '');

    // Handle different formats
    if (formatted.startsWith('0')) {
      formatted = '91' + formatted.substring(1);
    } else if (!formatted.startsWith('91')) {
      formatted = '91' + formatted;
    }

    // Validate length (should be 12 digits: 91 + 10 digits)
    if (formatted.length !== 12) {
      return null;
    }

    return formatted;
  }

  /**
   * Get course names from selected courses
   * @param {Array} selectedCourses - Array of course objects
   * @returns {string} Comma-separated course names
   */
  getCourseNames(selectedCourses) {
    if (!selectedCourses || !Array.isArray(selectedCourses)) {
      return 'our courses';
    }

    const courseNames = selectedCourses.map(course => {
      if (typeof course === 'string') return course;
      if (course && course.name) return course.name;
      return 'course';
    }).filter(name => name && name !== 'course');

    if (courseNames.length === 0) {
      return 'our courses';
    }

    return courseNames.join(', ');
  }

  /**
   * Enable/disable welcome message service
   * @param {boolean} enabled - Enable or disable
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔧 Welcome message service ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      whatsappReady: whatsappConnectionService.isReady,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay
    };
  }
}

// Create singleton instance
const welcomeMessageService = new WelcomeMessageService();

export default welcomeMessageService;
