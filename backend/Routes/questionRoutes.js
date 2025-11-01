import express from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { downloadTemplate, importQuestions, listByCourse, deleteByCourse } from '../Controllers/questionController.js';

const router = express.Router();

// Use memory storage for Excel buffer
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Only managers/admins can manage question bank
const MANAGER_ROLES = ['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin'];

router.get('/template', authMiddleware, requireRole(MANAGER_ROLES), downloadTemplate);
router.post('/import', authMiddleware, requireRole(MANAGER_ROLES), upload.single('file'), importQuestions);
router.get('/', authMiddleware, requireRole(MANAGER_ROLES), listByCourse);
router.delete('/course/:courseId', authMiddleware, requireRole(MANAGER_ROLES), deleteByCourse);

export default router;


