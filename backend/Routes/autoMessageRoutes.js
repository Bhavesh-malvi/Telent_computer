import express from 'express';
import autoMessageController from '../Controllers/autoMessageController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// WhatsApp Connection Management Routes
router.post('/whatsapp/initialize', autoMessageController.initializeWhatsApp);
router.get('/whatsapp/status', autoMessageController.getWhatsAppStatus);
router.get('/whatsapp/qr-code', autoMessageController.getQRCode);
router.post('/whatsapp/disconnect', autoMessageController.disconnectWhatsApp);

// Fee Reminder Service Routes
router.post('/fee-reminders/send', autoMessageController.sendFeeReminders);
router.get('/fee-reminders/status', autoMessageController.getFeeReminderStatus);

// Birthday Wish Service Routes
router.post('/birthday-wishes/send', autoMessageController.sendBirthdayWishes);
router.get('/birthday-wishes/status', autoMessageController.getBirthdayWishStatus);

// Admission Confirmation Service Routes
router.post('/admission-confirmations/send', autoMessageController.sendAdmissionConfirmations);
router.post('/admission-confirmations/send/:studentId', autoMessageController.sendAdmissionConfirmation);
router.get('/admission-confirmations/status', autoMessageController.getAdmissionConfirmationStatus);

// Fee Payment Message Service Routes
router.post('/fee-payment/send/:studentId', autoMessageController.sendFeePaymentConfirmation);
router.post('/installment-payment/send/:studentId', autoMessageController.sendInstallmentPaymentConfirmation);
router.post('/bulk-payment-confirmations/send', autoMessageController.sendBulkPaymentConfirmations);
router.get('/fee-payment/status', autoMessageController.getFeePaymentMessageStatus);

// General Status and Testing Routes
router.get('/status', autoMessageController.getAllServicesStatus);
router.post('/test-message', autoMessageController.sendTestMessage);

export default router;
