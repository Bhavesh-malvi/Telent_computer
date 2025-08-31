import express from 'express';
import schedulerController from '../Controllers/schedulerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Scheduler Management Routes
router.post('/initialize', schedulerController.initializeScheduler);
router.post('/start-all', schedulerController.startAllSchedules);
router.post('/stop-all', schedulerController.stopAllSchedules);
router.get('/status', schedulerController.getSchedulerStatus);
router.get('/info', schedulerController.getScheduleInfo);

// Manual Trigger Routes
router.post('/trigger/fee-reminders', schedulerController.triggerFeeReminders);
router.post('/trigger/birthday-wishes', schedulerController.triggerBirthdayWishes);
router.post('/trigger/admission-confirmations', schedulerController.triggerAdmissionConfirmations);

// Real-time Admission Confirmation Route
router.post('/admission-confirmation/:studentId', schedulerController.sendAdmissionConfirmationRealTime);

// Custom Schedule Routes
router.post('/custom/fee-reminders', schedulerController.startCustomFeeReminderSchedule);

export default router;
