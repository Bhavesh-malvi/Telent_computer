import express from 'express';
import reminderSettingsController from '../Controllers/reminderSettingsController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Get current settings
router.get('/settings', authMiddleware, requireRole(['Admin', 'SuperAdmin']), reminderSettingsController.getSettings);

// Update settings
router.put('/settings', authMiddleware, requireRole(['Admin', 'SuperAdmin']), reminderSettingsController.updateSettings);

// Get service status
router.get('/status', authMiddleware, requireRole(['Admin', 'SuperAdmin']), reminderSettingsController.getStatus);

// Manual trigger
router.post('/trigger', authMiddleware, requireRole(['Admin', 'SuperAdmin']), reminderSettingsController.triggerNow);

// Manual birthday wishes trigger
router.post('/trigger-birthday', authMiddleware, requireRole(['Admin', 'SuperAdmin']), reminderSettingsController.triggerBirthdayWishes);

export default router;
