import express from 'express';
import autoMessageSettingsController from '../Controllers/autoMessageSettingsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current settings
router.get('/settings', authenticateToken, autoMessageSettingsController.getSettings);

// Update settings
router.put('/settings', authenticateToken, autoMessageSettingsController.updateSettings);

// Reset to default settings
router.post('/settings/reset', authenticateToken, autoMessageSettingsController.resetSettings);

export default router;
