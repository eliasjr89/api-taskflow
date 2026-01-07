// src/routes/announcement.routes.js
import { Router } from 'express';
import {
  createAnnouncement,
  getActiveAnnouncements,
  deactivateAnnouncement,
} from '../controllers/announcementController.js';
import { authMiddleware, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

// Public (Authenticated)
router.get('/active', getActiveAnnouncements);

// Admin / Manager Only
import { getAllAnnouncements } from '../controllers/announcementController.js';
router.get('/', restrictTo('admin', 'manager'), getAllAnnouncements);
router.post('/', restrictTo('admin', 'manager'), createAnnouncement);
router.delete('/:id', restrictTo('admin', 'manager'), deactivateAnnouncement);

export default router;
