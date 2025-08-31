import express from 'express';
import chapterController from '../Controllers/chapterController.js';
const { addChapter, getChaptersByCourse, editChapter, deleteChapter, addTopicToChapter } = chapterController;
import multer from 'multer';
const storage = multer.diskStorage({});
const upload = multer({ storage });
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Add Chapter (Manager or SuperAdmin)
router.post('/:courseId', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), addChapter);
router.get('/:courseId', getChaptersByCourse);
// Edit Chapter (Manager or SuperAdmin)
router.put('/edit/:chapterId', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), editChapter);
// Delete Chapter (SuperAdmin only)
router.delete('/delete/:chapterId', authMiddleware, requireRole(['SuperAdmin']), deleteChapter);
// Add topic (Manager or SuperAdmin)
router.post('/add-topic/:chapterId', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), upload.single('pdf'), addTopicToChapter);
// Edit topic (Manager or SuperAdmin)
router.put('/edit-topic/:chapterId/:topicIdx', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), chapterController.editTopicInChapter);
// Delete topic (SuperAdmin only)
router.delete('/delete-topic/:chapterId/:topicIdx', authMiddleware, requireRole(['SuperAdmin']), chapterController.deleteTopicFromChapter);

export default router; 