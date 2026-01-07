import { Router } from 'express';
import {
  resetDatabase,
  getDatabaseStats,
  getAuditLogs,
  clearAuditLogs,
  getSystemHealth,
  getNewDashboardStats,
  impersonateUser,
} from '../controllers/adminController.js';
import { archiveOldTasks } from '../controllers/batchController.js';
import {
  getWebhooks,
  createWebhook,
  deleteWebhook,
} from '../controllers/webhookController.js';
import { authMiddleware, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

// Proteger todas las rutas: Solo autenticados y con rol 'admin'
router.use(authMiddleware);
router.use(restrictTo('admin', 'manager')); // Allow managers to view stats too?

router.post('/reset-db', restrictTo('admin'), resetDatabase); // Only admin can reset
router.get('/stats', getDatabaseStats); // Legacy
router.get('/dashboard', getNewDashboardStats); // New
router.get('/health', getSystemHealth);
router.post('/impersonate', restrictTo('admin'), impersonateUser);
router.post('/batch/archive-tasks', restrictTo('admin'), archiveOldTasks);

// Session Management
import {
  getUserSessions,
  killUserSession,
} from '../controllers/adminController.js';
router.get('/users/:id/sessions', getUserSessions);
router.delete('/sessions/:sessionId', restrictTo('admin'), killUserSession);

// Role & Permission Management
import {
  getRoles,
  getPermissions,
  createRole as createRoleCtrl,
  updateRole as updateRoleCtrl,
  deleteRole as deleteRoleCtrl,
} from '../controllers/roleController.js';

router.get('/roles', restrictTo('admin'), getRoles);
router.post('/roles', restrictTo('admin'), createRoleCtrl);
router.put('/roles/:id', restrictTo('admin'), updateRoleCtrl);
router.delete('/roles/:id', restrictTo('admin'), deleteRoleCtrl);
router.get('/permissions', restrictTo('admin'), getPermissions);

// Webhooks
router.get('/webhooks', restrictTo('admin'), getWebhooks);
router.post('/webhooks', restrictTo('admin'), createWebhook);
router.delete('/webhooks/:id', restrictTo('admin'), deleteWebhook);

router.get('/activity', getAuditLogs);
router.delete('/activity', restrictTo('admin'), clearAuditLogs);

// System Settings
import {
  getSettings,
  updateSetting,
} from '../controllers/settingsController.js';
router.get('/settings', restrictTo('admin'), getSettings);
router.put('/settings/:key', restrictTo('admin'), updateSetting);

export default router;
