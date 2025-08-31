import express from 'express';
import feePaymentMessageController from '../Controllers/feePaymentMessageController.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply role-based authentication to all routes
router.use(requireRole(['IT Manager', 'SuperAdmin']));

// Get fee payment message service status
router.get('/status', feePaymentMessageController.getStatus);

// Enable/disable fee payment message service
router.post('/toggle', feePaymentMessageController.toggleService);

// Get all fee payment message templates
router.get('/templates', feePaymentMessageController.getTemplates);

// Test fee payment message sending
router.post('/test', feePaymentMessageController.testFeePaymentMessage);

// Get fee payment message statistics
router.get('/statistics', feePaymentMessageController.getStatistics);

export default router;
