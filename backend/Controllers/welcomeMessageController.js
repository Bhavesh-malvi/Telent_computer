import welcomeMessageService from '../services/welcomeMessageService.js';
import { getAllTemplates } from '../utils/welcomeMessages.js';

const welcomeMessageController = {
  // Get welcome message service status
  getStatus: async (req, res) => {
    try {
      const status = welcomeMessageService.getStatus();
      res.json({
        success: true,
        status: status
      });
    } catch (error) {
      console.error('❌ Error getting welcome message status:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting welcome message status',
        error: error.message
      });
    }
  },

  // Enable/disable welcome message service
  toggleService: async (req, res) => {
    try {
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'enabled must be a boolean value'
        });
      }

      welcomeMessageService.setEnabled(enabled);
      
      res.json({
        success: true,
        message: `Welcome message service ${enabled ? 'enabled' : 'disabled'}`,
        status: welcomeMessageService.getStatus()
      });
    } catch (error) {
      console.error('❌ Error toggling welcome message service:', error);
      res.status(500).json({
        success: false,
        message: 'Error toggling welcome message service',
        error: error.message
      });
    }
  },

  // Get all welcome message templates
  getTemplates: async (req, res) => {
    try {
      const templates = getAllTemplates();
      res.json({
        success: true,
        templates: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('❌ Error getting welcome message templates:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting welcome message templates',
        error: error.message
      });
    }
  },

  // Test welcome message sending (for testing purposes)
  testWelcomeMessage: async (req, res) => {
    try {
      const { studentName, phoneNumber, courseNames } = req.body;

      // Validate required fields
      if (!studentName || !phoneNumber || !courseNames) {
        return res.status(400).json({
          success: false,
          message: 'studentName, phoneNumber, and courseNames are required'
        });
      }

      // Create test student object
      const testStudent = {
        name: studentName,
        studentId: 'TEST-001',
        contactNo: phoneNumber,
        selectedCourses: Array.isArray(courseNames) 
          ? courseNames.map(name => ({ name }))
          : [{ name: courseNames }],
        enquiryType: 'Admission'
      };

      console.log('🧪 Testing welcome message with:', testStudent);

      // Send test welcome message
      const result = await welcomeMessageService.sendWelcomeMessage(testStudent);

      res.json({
        success: result.success,
        message: result.message,
        testStudent: testStudent,
        result: result
      });

    } catch (error) {
      console.error('❌ Error testing welcome message:', error);
      res.status(500).json({
        success: false,
        message: 'Error testing welcome message',
        error: error.message
      });
    }
  },

  // Get welcome message statistics
  getStatistics: async (req, res) => {
    try {
      const status = welcomeMessageService.getStatus();
      
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
      console.error('❌ Error getting welcome message statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting welcome message statistics',
        error: error.message
      });
    }
  }
};

export default welcomeMessageController;
