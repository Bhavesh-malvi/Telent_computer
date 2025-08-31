import express from 'express';
import authController from '../Controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const storage = multer.diskStorage({});
const upload = multer({ storage });

// Public routes
router.post('/login', authController.loginStudent);
router.post('/staff/login', authController.loginStaff);
router.post('/superadmin/register', authController.registerSuperAdmin);
router.post('/generate-otp', authController.generateOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/update-password', authController.updatePassword);

// Protected routes
router.use(authMiddleware);
router.get('/profile', authController.getProfile);
router.get('/validate-token', authController.validateToken);
router.post('/logout', authController.logoutStudent);
router.post('/staff/logout', authController.logoutStaff);
router.post('/update-profile-image', upload.single('image'), authController.updateProfileImage);

export default router; 