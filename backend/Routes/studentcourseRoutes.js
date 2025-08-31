import express from 'express';
import courseController from '../Controllers/studentcourseController.js';
import multer from 'multer';
import { getStudentCourseById } from '../Controllers/studentcourseController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
const router = express.Router();
const storage = multer.diskStorage({});
const upload = multer({ storage });

// Add course (Manager or SuperAdmin)
router.post('/', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), upload.fields([
  { name: 'image', maxCount: 1 },
]), courseController.addCourse);

// Edit course (Manager or SuperAdmin)
router.put('/:id', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), upload.fields([
  { name: 'image', maxCount: 1 },
]), courseController.editCourse);

// Delete course (SuperAdmin only)
router.delete('/:id', authMiddleware, requireRole(['SuperAdmin']), courseController.deleteCourse);
router.get('/', courseController.getCourses);
router.get('/:id', getStudentCourseById);

export default router; 