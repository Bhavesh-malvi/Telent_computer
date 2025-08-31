import express from 'express';
import { 
  createContact, 
  getAllContacts, 
  getContactById, 
  deleteContact 
} from '../Controllers/contactController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// POST - Create new contact message
router.post('/', createContact);

// GET - Get all contact messages
router.get('/', getAllContacts);

// GET - Get single contact message by ID
router.get('/:id', getContactById);

// DELETE - Delete contact message by ID (SuperAdmin only)
router.delete('/:id', authMiddleware, requireRole(['SuperAdmin']), deleteContact);

export default router; 