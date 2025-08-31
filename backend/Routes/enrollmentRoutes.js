import express from 'express';
import { 
  createEnrollment, 
  getAllEnrollments, 
  getEnrollmentById, 
  deleteEnrollment 
} from '../Controllers/enrollmentController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// POST - Create new enrollment (Manager or SuperAdmin)
router.post('/', createEnrollment);

// GET - Get all enrollments
router.get('/', getAllEnrollments);

// GET - Get single enrollment by ID
router.get('/:id', getEnrollmentById);

// DELETE - Delete enrollment by ID (SuperAdmin only)
router.delete('/:id', authMiddleware, requireRole(['SuperAdmin']), deleteEnrollment);

export default router; 