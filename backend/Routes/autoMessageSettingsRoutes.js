import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current settings
router.get('/settings', authenticateToken, (req, res) => {
  res.json({ success: true, settings: { isActive: false } });
});

// Update settings
router.put('/settings', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Settings saved (stub)' });
});

// Reset to default settings
router.post('/settings/reset', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Settings reset (stub)' });
});

export default router;
