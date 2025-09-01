import express from 'express';
import whatsappController from '../Controllers/whatsappController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/status', whatsappController.getWhatsAppStatus);
router.get('/birthday-wishes-status', whatsappController.getBirthdayWishesStatus);
router.get('/reminder-settings', whatsappController.getReminderSettings);
router.post('/initialize', whatsappController.initializeWhatsApp);
router.post('/regenerate-qr', whatsappController.regenerateQR);
router.post('/disconnect', whatsappController.disconnectWhatsApp);
router.post('/force-disconnect', whatsappController.forceDisconnectWhatsApp);

// All WhatsApp routes are public (no authentication required)

// WhatsApp Integration Routes
router.post('/send-reminders', whatsappController.sendWhatsAppReminders);
router.post('/test-reminders', whatsappController.testReminders);
// Test automatic reminders manually
router.post('/test-automatic-reminders', whatsappController.testAutomaticReminders);
// Get automatic reminder service status
router.get('/automatic-reminder-status', whatsappController.getAutomaticReminderStatus);

// Get today's summary of birthday wishes and fee reminders
router.get('/today-summary', whatsappController.getTodaySummary);

// Get weekly summary of birthday wishes and fee reminders
router.get('/weekly-summary', whatsappController.getWeeklySummary);



// Update reminder settings
router.put('/reminder-settings', whatsappController.updateReminderSettings);

// Birthday Wishes Routes
router.post('/test-birthday-wishes', whatsappController.testBirthdayWishes);

export default router;
