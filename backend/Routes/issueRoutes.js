import express from 'express';
import issueController from '../Controllers/issueController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Get all issues
router.get('/', issueController.getAllIssues);

// Get all active issues for a specific student
router.get('/student/:studentId', issueController.getStudentIssues);

// Get IDs of all students with active issues
router.get('/active-students', issueController.getStudentsWithActiveIssues);

// Update issue status (Manager or SuperAdmin)
router.put('/:issueId/status', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), issueController.updateIssueStatus);

// Create a new issue (Manager or SuperAdmin)
router.post('/', authMiddleware, issueController.createIssue);

export default router; 