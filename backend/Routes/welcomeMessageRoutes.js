import express from 'express';
import welcomeMessageController from '../Controllers/welcomeMessageController.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply role-based authentication to all routes
router.use(requireRole(['IT Manager', 'SuperAdmin']));

// Get welcome message service status
router.get('/status', welcomeMessageController.getStatus);

// Enable/disable welcome message service
router.post('/toggle', welcomeMessageController.toggleService);

// Get all welcome message templates
router.get('/templates', welcomeMessageController.getTemplates);

// Test welcome message sending
router.post('/test', welcomeMessageController.testWelcomeMessage);

// Get welcome message statistics
router.get('/statistics', welcomeMessageController.getStatistics);

export default router;
