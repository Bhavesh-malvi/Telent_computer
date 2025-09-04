import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Get current settings
router.get('/settings', authMiddleware, requireRole(['Admin', 'SuperAdmin']), (req, res) => {
  res.json({ success: true, data: { reminderGap: 4, reminderTime: '10:00', isActive: false, birthdayWishTime: '09:00', birthdayWishesActive: false } });
});

// Update settings
router.put('/settings', authMiddleware, requireRole(['Admin', 'SuperAdmin']), (req, res) => {
  res.json({ success: true, message: 'Settings updated (stub)' });
});

// Get service status
router.get('/status', authMiddleware, requireRole(['Admin', 'SuperAdmin']), (req, res) => {
  res.json({ success: true, data: { active: false, note: 'Automation removed' } });
});

// Manual trigger
router.post('/trigger', authMiddleware, requireRole(['Admin', 'SuperAdmin']), (req, res) => {
  res.json({ success: false, message: 'Automation removed' });
});

// Manual birthday wishes trigger
router.post('/trigger-birthday', authMiddleware, requireRole(['Admin', 'SuperAdmin']), (req, res) => {
  res.json({ success: false, message: 'Automation removed' });
});

export default router;
