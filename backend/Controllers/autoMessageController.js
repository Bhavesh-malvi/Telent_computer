import feeReminderService from '../services/messages/feeReminderService.js';
import birthdayWishService from '../services/messages/birthdayWishService.js';
import admissionConfirmationService from '../services/messages/admissionConfirmationService.js';
import feePaymentMessageService from '../services/messages/feePaymentMessageService.js';
import whatsappConnectionService from '../services/whatsapp/core/connectionService.js';
import QRCode from 'qrcode';

class AutoMessageController {
  // WhatsApp Connection Management
  async initializeWhatsApp(req, res) {
    try {
      console.log('🔄 Initializing WhatsApp connection...');
      
      await whatsappConnectionService.initialize();
      
      res.status(200).json({
        success: true,
        message: 'WhatsApp initialization started',
        status: whatsappConnectionService.getStatus()
      });
    } catch (error) {
      console.error('❌ Error initializing WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize WhatsApp',
        error: error.message
      });
    }
  }

  async getWhatsAppStatus(req, res) {
    try {
      // Get status without forcing ready check to avoid loops
      const status = whatsappConnectionService.getStatus();
      
      res.status(200).json({
        success: true,
        whatsapp: status
      });
    } catch (error) {
      console.error('❌ Error getting WhatsApp status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get WhatsApp status',
        error: error.message
      });
    }
  }

  async getQRCode(req, res) {
    try {
      console.log('📱 Getting QR code...');
      
      // Check if client is initialized
      if (!whatsappConnectionService.isInitialized) {
        console.log('⚠️ WhatsApp client not initialized, initializing now...');
        await whatsappConnectionService.initialize();
      }

      // Wait a bit for QR code to be generated
      let attempts = 0;
      let qrCodeString = null;
      
      while (attempts < 10 && !qrCodeString) {
        qrCodeString = whatsappConnectionService.getQRCode();
        if (!qrCodeString) {
          console.log(`⏳ Waiting for QR code... attempt ${attempts + 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      
      if (!qrCodeString) {
        return res.status(404).json({
          success: false,
          message: 'QR code not available after initialization. Please try again.'
        });
      }

      console.log('✅ QR code string received, converting to image...');

      // Convert QR code string to base64 image
      const qrCodeImage = await QRCode.toDataURL(qrCodeString, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Extract base64 data from data URL
      const base64Data = qrCodeImage.split(',')[1];

      console.log('✅ QR code image generated successfully');

      res.status(200).json({
        success: true,
        qrCode: base64Data,
        message: 'QR code generated successfully'
      });
    } catch (error) {
      console.error('❌ Error getting QR code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get QR code',
        error: error.message
      });
    }
  }

  async disconnectWhatsApp(req, res) {
    try {
      await whatsappConnectionService.disconnect();
      
      res.status(200).json({
        success: true,
        message: 'WhatsApp disconnected successfully'
      });
    } catch (error) {
      console.error('❌ Error disconnecting WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disconnect WhatsApp',
        error: error.message
      });
    }
  }

  // Fee Reminder Service
  async sendFeeReminders(req, res) {
    try {
      console.log('📱 Sending fee reminders...');
      
      const result = await feeReminderService.sendFeeReminders();
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('❌ Error sending fee reminders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send fee reminders',
        error: error.message
      });
    }
  }

  async getFeeReminderStatus(req, res) {
    try {
      const status = feeReminderService.getStatus();
      
      res.status(200).json({
        success: true,
        status: status
      });
    } catch (error) {
      console.error('❌ Error getting fee reminder status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get fee reminder status',
        error: error.message
      });
    }
  }

  // Birthday Wish Service
  async sendBirthdayWishes(req, res) {
    try {
      console.log('🎂 Sending birthday wishes...');
      
      const result = await birthdayWishService.sendBirthdayWishes();
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('❌ Error sending birthday wishes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send birthday wishes',
        error: error.message
      });
    }
  }

  async getBirthdayWishStatus(req, res) {
    try {
      const status = birthdayWishService.getStatus();
      
      res.status(200).json({
        success: true,
        status: status
      });
    } catch (error) {
      console.error('❌ Error getting birthday wish status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get birthday wish status',
        error: error.message
      });
    }
  }

  // Admission Confirmation Service
  async sendAdmissionConfirmations(req, res) {
    try {
      console.log('🎓 Sending admission confirmations...');
      
      const result = await admissionConfirmationService.sendAdmissionConfirmations();
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('❌ Error sending admission confirmations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send admission confirmations',
        error: error.message
      });
    }
  }

  async sendAdmissionConfirmation(req, res) {
    try {
      const { studentId } = req.params;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      console.log(`🎓 Sending admission confirmation for student: ${studentId}`);
      
      const result = await admissionConfirmationService.sendAdmissionConfirmation(studentId);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('❌ Error sending admission confirmation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send admission confirmation',
        error: error.message
      });
    }
  }

  async getAdmissionConfirmationStatus(req, res) {
    try {
      const status = admissionConfirmationService.getStatus();
      
      res.status(200).json({
        success: true,
        status: status
      });
    } catch (error) {
      console.error('❌ Error getting admission confirmation status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get admission confirmation status',
        error: error.message
      });
    }
  }

  // Fee Payment Message Service
  async sendFeePaymentConfirmation(req, res) {
    try {
      const { studentId } = req.params;
      const paymentData = req.body;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      if (!paymentData || !paymentData.amount) {
        return res.status(400).json({
          success: false,
          message: 'Payment data with amount is required'
        });
      }

      console.log(`💰 Sending fee payment confirmation for student: ${studentId}`);
      
      const result = await feePaymentMessageService.sendFeePaymentConfirmation(studentId, paymentData);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('❌ Error sending fee payment confirmation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send fee payment confirmation',
        error: error.message
      });
    }
  }

  async sendInstallmentPaymentConfirmation(req, res) {
    try {
      const { studentId } = req.params;
      const installmentData = req.body;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      if (!installmentData || !installmentData.amount) {
        return res.status(400).json({
          success: false,
          message: 'Installment data with amount is required'
        });
      }

      console.log(`💰 Sending installment payment confirmation for student: ${studentId}`);
      
      const result = await feePaymentMessageService.sendInstallmentPaymentConfirmation(studentId, installmentData);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('❌ Error sending installment payment confirmation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send installment payment confirmation',
        error: error.message
      });
    }
  }

  async sendBulkPaymentConfirmations(req, res) {
    try {
      const { payments } = req.body;
      
      if (!payments || !Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Payments array is required'
        });
      }

      console.log(`💰 Sending ${payments.length} bulk payment confirmations...`);
      
      const result = await feePaymentMessageService.sendBulkPaymentConfirmations(payments);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('❌ Error sending bulk payment confirmations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk payment confirmations',
        error: error.message
      });
    }
  }

  async getFeePaymentMessageStatus(req, res) {
    try {
      const status = feePaymentMessageService.getStatus();
      
      res.status(200).json({
        success: true,
        status: status
      });
    } catch (error) {
      console.error('❌ Error getting fee payment message status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get fee payment message status',
        error: error.message
      });
    }
  }

  // All Services Status
  async getAllServicesStatus(req, res) {
    try {
      const status = {
        whatsapp: whatsappConnectionService.getStatus(),
        feeReminder: feeReminderService.getStatus(),
        birthdayWish: birthdayWishService.getStatus(),
        admissionConfirmation: admissionConfirmationService.getStatus(),
        feePaymentMessage: feePaymentMessageService.getStatus(),
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json({
        success: true,
        status: status
      });
    } catch (error) {
      console.error('❌ Error getting all services status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get all services status',
        error: error.message
      });
    }
  }

  // Test Message
  async sendTestMessage(req, res) {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and message are required'
        });
      }

      console.log(`📱 Sending test message to ${phoneNumber}`);
      
      const messageService = feeReminderService.messageService;
      const result = await messageService.sendMessage(phoneNumber, message);
      
      res.status(200).json({
        success: true,
        message: 'Test message sent',
        data: result
      });
    } catch (error) {
      console.error('❌ Error sending test message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test message',
        error: error.message
      });
    }
  }
}

export default new AutoMessageController();
