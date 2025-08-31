import { generateFeePaymentMessage } from '../utils/feePaymentMessages.js';
import whatsappConnectionService from './whatsapp/core/connectionService.js';
import whatsappMessageService from './whatsapp/core/messageService.js';

class FeePaymentMessageService {
  constructor() {
    this.isEnabled = true;
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Send fee payment confirmation message to student
   * @param {Object} student - Student object with details
   * @param {number} amount - Payment amount
   * @param {Object} paymentDetails - Additional payment details
   * @returns {Object} Result of message sending
   */
  async sendFeePaymentMessage(student, amount, paymentDetails = {}) {
    try {
      // Check if service is enabled
      if (!this.isEnabled) {
        console.log('⚠️ Fee payment message service is disabled');
        return {
          success: false,
          message: 'Fee payment message service is disabled',
          studentId: student.studentId
        };
      }

      // Validate student data
      if (!this.validateStudentData(student)) {
        return {
          success: false,
          message: 'Invalid student data for fee payment message',
          studentId: student.studentId
        };
      }

      // Validate amount
      if (!amount || amount <= 0) {
        return {
          success: false,
          message: 'Invalid payment amount',
          studentId: student.studentId
        };
      }

      // Check if WhatsApp is ready
      if (!whatsappConnectionService.isReady) {
        console.log('❌ WhatsApp not ready for fee payment message');
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

      // Generate fee payment message
      const paymentMessage = generateFeePaymentMessage(student.name, amount);

      console.log(`💰 Sending fee payment confirmation to ${student.name} (${student.studentId})`);
      console.log(`📞 Phone: ${phoneNumber}`);
      console.log(`💵 Amount: ₹${amount.toLocaleString('en-IN')}`);

      // Send message with simple retry mechanism (NO force reconnect)
      const result = await this.simpleSendMessage(phoneNumber, paymentMessage, student, amount);

      if (result.success) {
        console.log(`✅ Fee payment message sent successfully to ${student.name}`);
      } else {
        console.log(`❌ Failed to send fee payment message to ${student.name}: ${result.message}`);
      }

      return result;

    } catch (error) {
      console.error(`❌ Error sending fee payment message to ${student.name}:`, error.message);
      return {
        success: false,
        message: error.message,
        studentId: student.studentId,
        error: error
      };
    }
  }

  /**
   * Simple message sending with retry (NO force reconnect)
   * @param {string} phoneNumber - Formatted phone number
   * @param {string} message - Message to send
   * @param {Object} student - Student object for logging
   * @param {number} amount - Payment amount for logging
   * @returns {Object} Result of sending
   */
  async simpleSendMessage(phoneNumber, message, student, amount) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${this.retryAttempts} - Sending fee payment message to ${student.name} (₹${amount.toLocaleString('en-IN')})`);

        // Simple direct message sending - NO aggressive checks or force reconnect
        const result = await whatsappMessageService.sendMessage(phoneNumber, message);
        
        console.log(`✅ Fee payment message sent successfully to ${student.name} (Message ID: ${result.id.id})`);

        return {
          success: true,
          message: 'Fee payment message sent successfully',
          studentId: student.studentId,
          attempt: attempt,
          messageId: result.id.id,
          amount: amount
        };

      } catch (error) {
        console.log(`⚠️ Attempt ${attempt} failed for ${student.name}: ${error.message}`);

        if (attempt === this.retryAttempts) {
          return {
            success: false,
            message: `Failed after ${this.retryAttempts} attempts: ${error.message}`,
            studentId: student.studentId,
            attempts: attempt,
            error: error.message,
            amount: amount
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
   * Validate student data for fee payment message
   * @param {Object} student - Student object
   * @returns {boolean} Is valid
   */
  validateStudentData(student) {
    if (!student) return false;
    if (!student.name) return false;
    if (!student.studentId) return false;
    if (!student.contactNo && !student.phone) return false;

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
   * Enable/disable fee payment message service
   * @param {boolean} enabled - Enable or disable
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔧 Fee payment message service ${enabled ? 'enabled' : 'disabled'}`);
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
const feePaymentMessageService = new FeePaymentMessageService();

export default feePaymentMessageService;
