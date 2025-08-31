import express from 'express';
import multer from 'multer';
import staffController from '../Controllers/staffController.js';
import Staff from '../Model/Staff.js';
import { Server as SocketIOServer } from 'socket.io';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Use memory storage; we'll upload buffer to Cloudinary
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// List staff (Manager or SuperAdmin)
router.get('/', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), staffController.listStaff);
router.get('/:id', authMiddleware, requireRole(['IT Manager', 'Basic Manager', 'Manager', 'SuperAdmin']), staffController.getStaffById);
// Create/Update/Delete staff (SuperAdmin only)
router.post('/', authMiddleware, requireRole(['SuperAdmin']), upload.single('profileImage'), staffController.createStaff);
router.put('/:id', authMiddleware, requireRole(['SuperAdmin']), upload.single('profileImage'), staffController.updateStaff);
router.delete('/:id', authMiddleware, requireRole(['SuperAdmin']), staffController.deleteStaff);

// Heartbeat route to update presence
router.post('/heartbeat', authMiddleware, requireRole(['IT Clerk','Basic Clerk','Clerk','IT Manager','Basic Manager','Manager','SuperAdmin']), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const updated = await Staff.findByIdAndUpdate(userId, { lastActiveAt: new Date() }, { new: true, select: '_id lastActiveAt' });
    try {
      req.app.get('io')?.emit('staff:presence', { id: String(updated._id), lastActiveAt: updated.lastActiveAt });
    } catch {}
    res.json({ ok: true });
  } catch (e) {
    console.error('Heartbeat error:', e?.message);
    res.status(500).json({ ok: false });
  }
});

export default router;


