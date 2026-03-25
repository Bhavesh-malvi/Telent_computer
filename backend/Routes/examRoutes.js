import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { adminSetEligibility, adminSetPassword, getEligibleCourses, startExam, getAttempt, submitAttempt } from '../Controllers/examController.js';

const router = express.Router();

// Admin endpoints
router.post('/admin/eligibility', authMiddleware, requireRole(['Manager', 'SuperAdmin', 'IT Manager', 'Basic Manager']), adminSetEligibility);
router.post('/admin/set-password', authMiddleware, requireRole(['Manager', 'SuperAdmin', 'IT Manager', 'Basic Manager']), adminSetPassword);

// Student endpoints (authMiddleware assumed to handle token; adjust if separate student auth)
router.get('/eligible-courses', authMiddleware, getEligibleCourses);
router.post('/start', authMiddleware, startExam);
router.get('/attempt/:attemptId', authMiddleware, getAttempt);
router.post('/submit', authMiddleware, submitAttempt);

export default router;


