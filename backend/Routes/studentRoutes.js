import express from 'express';
import studentController from '../Controllers/studentController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import multer from 'multer';
const router = express.Router();
const storage = multer.diskStorage({});
const upload = multer({ storage });

// Public reads allowed, mutations protected below

// Register student (Manager or SuperAdmin)
router.post('/register', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
  { name: 'marksheets', maxCount: 10 } // marksheets field allow kiya
]), studentController.registerStudent);
router.get('/next-form-no', studentController.getNextFormNo);
// Update student (Manager or SuperAdmin)
router.put('/:id', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
  { name: 'marksheets', maxCount: 10 }
]), studentController.updateStudent);
// Delete student (SuperAdmin only)
router.delete('/:id', authMiddleware, requireRole(['SuperAdmin']), studentController.deleteStudent);
router.get('/birthday', studentController.getTodaysBirthdays);
router.post('/birthday/send-wishes', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), studentController.sendBirthdayWishes);
router.get('/ex-students', studentController.getExStudentsByYear);
router.post('/ex-students/export', studentController.exportExStudentsToExcel);
router.post('/export', studentController.exportStudentsToExcel);
router.post('/export-filtered', studentController.exportFilteredStudentsToExcel);
router.get('/ex-students/years', studentController.getExStudentYears);
router.get('/:id', studentController.getStudent);
// Pay installment (Manager or SuperAdmin)
router.post('/:id/pay', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), studentController.payInstallment);
router.get('/', studentController.getAllStudents);
// Delete payment (Manager or SuperAdmin)
router.delete('/:id/payment/:paymentId', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), studentController.deletePayment);
// Issue status update (Manager or SuperAdmin)
router.put('/issues/:issueId/status', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), studentController.updateIssueStatus);
// Cheque status update (Manager or SuperAdmin)
router.patch('/:id/payment/:paymentId/cheque-status', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), studentController.updateChequeStatus);
router.get('/:id/fee-details', studentController.getStudentFeeDetails);

export default router; 