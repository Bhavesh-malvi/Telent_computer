import express from 'express';
import whatsappController from '../Controllers/whatsappController.js';

const router = express.Router();

// Completely public route - no middleware at all
router.post('/initialize', whatsappController.initializeWhatsApp);

export default router;
