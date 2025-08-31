import feePaymentMessageService from '../services/feePaymentMessageService.js';
import { getAllTemplates } from '../utils/feePaymentMessages.js';

const feePaymentMessageController = {
  // Get fee payment message service status
  getStatus: async (req, res) => {
    try {
      const status = feePaymentMessageService.getStatus();
      res.json({
        success: true,
        status: status
      });
    } catch (error) {
      console.error('❌ Error getting fee payment message status:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting fee payment message status',
        error: error.message
      });
    }
  },

  // Enable/disable fee payment message service
  toggleService: async (req, res) => {
    try {
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'enabled must be a boolean value'
        });
      }

      feePaymentMessageService.setEnabled(enabled);
      
      res.json({
        success: true,
        message: `Fee payment message service ${enabled ? 'enabled' : 'disabled'}`,
        status: feePaymentMessageService.getStatus()
      });
    } catch (error) {
      console.error('❌ Error toggling fee payment message service:', error);
      res.status(500).json({
        success: false,
        message: 'Error toggling fee payment message service',
        error: error.message
      });
    }
  },

  // Get all fee payment message templates
  getTemplates: async (req, res) => {
    try {
      const templates = getAllTemplates();
      res.json({
        success: true,
        templates: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('❌ Error getting fee payment message templates:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting fee payment message templates',
        error: error.message
      });
    }
  },

  // Test fee payment message sending (for testing purposes)
  testFeePaymentMessage: async (req, res) => {
    try {
      const { studentName, phoneNumber, amount } = req.body;

      // Validate required fields
      if (!studentName || !phoneNumber || !amount) {
        return res.status(400).json({
          success: false,
          message: 'studentName, phoneNumber, and amount are required'
        });
      }

      // Validate amount
      const paymentAmount = Number(amount);
      if (!paymentAmount || paymentAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'amount must be a positive number'
        });
      }

      // Create test student object
      const testStudent = {
        name: studentName,
        studentId: 'TEST-001',
        contactNo: phoneNumber,
        enquiryType: 'Admission'
      };

      console.log('🧪 Testing fee payment message with:', testStudent, 'Amount:', paymentAmount);

      // Send test fee payment message
      const result = await feePaymentMessageService.sendFeePaymentMessage(testStudent, paymentAmount);

      res.json({
        success: result.success,
        message: result.message,
        testStudent: testStudent,
        amount: paymentAmount,
        result: result
      });

    } catch (error) {
      console.error('❌ Error testing fee payment message:', error);
      res.status(500).json({
        success: false,
        message: 'Error testing fee payment message',
        error: error.message
      });
    }
  },

  // Get fee payment message statistics
  getStatistics: async (req, res) => {
    try {
      const status = feePaymentMessageService.getStatus();
      
      // You can add more statistics here like:
      // - Total messages sent today
      // - Success rate
      // - Failed attempts
      // - etc.

      res.json({
        success: true,
        statistics: {
          serviceEnabled: status.enabled,
          whatsappReady: status.whatsappReady,
          retryAttempts: status.retryAttempts,
          retryDelay: status.retryDelay,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error getting fee payment message statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting fee payment message statistics',
        error: error.message
      });
    }
  }
};

export default feePaymentMessageController;
