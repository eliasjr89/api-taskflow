import { Router } from 'express';
import {
  resetDatabase,
  getDatabaseStats,
  getAuditLogs,
  clearAuditLogs,
} from '../controllers/adminController.js';
import { authMiddleware, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

// Proteger todas las rutas: Solo autenticados y con rol 'admin'
router.use(authMiddleware);
router.use(restrictTo('admin'));

router.post('/reset-db', resetDatabase);
router.get('/stats', getDatabaseStats);
router.get('/activity', getAuditLogs);
router.delete('/activity', clearAuditLogs);

export default router;
