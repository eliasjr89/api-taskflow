// src/routes/tasks.routes.js
import { Router } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addUsersToTask,
  removeUserFromTask,
  addTagsToTask,
  removeTagFromTask,
  getTaskUsers,
  getTaskTags,
} from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  cacheMiddleware,
  clearCacheMw,
} from '../middleware/cache.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  getTasksQuerySchema,
  addUsersToTaskSchema,
  removeUserFromTaskSchema,
  addTagsToTaskSchema,
  removeTagFromTaskSchema,
} from '../schemas/task.schema.js';

const router = Router();

// Protect all routes
router.use(authMiddleware);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Obtener todas las tareas
 *     tags: [Tasks]
 */
router.get(
  '/',
  validateQuery(getTasksQuerySchema),
  cacheMiddleware(),
  getAllTasks,
);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Obtener tarea por ID
 *     tags: [Tasks]
 */
router.get('/:id', validateParams(getTaskSchema), getTaskById);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Crear una nueva tarea
 *     tags: [Tasks]
 */
router.post(
  '/',
  validateBody(createTaskSchema),
  clearCacheMw('/taskflow/tasks*'),
  clearCacheMw('/taskflow/projects*'),
  createTask,
);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Actualizar tarea
 *     tags: [Tasks]
 */
router.put(
  '/:id',
  validateParams(updateTaskSchema),
  clearCacheMw('/taskflow/tasks*'),
  clearCacheMw('/taskflow/projects*'),
  updateTask,
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Eliminar tarea
 *     tags: [Tasks]
 */
router.delete(
  '/:id',
  validateParams(getTaskSchema),
  clearCacheMw('/taskflow/tasks*'),
  clearCacheMw('/taskflow/projects*'),
  deleteTask,
);

// Task Users
router.get('/:id/users', validateParams(getTaskSchema), getTaskUsers);
router.post(
  '/:id/users',
  validateBody(addUsersToTaskSchema),
  clearCacheMw('/taskflow/tasks*'),
  clearCacheMw('/taskflow/projects*'),
  addUsersToTask,
);
router.delete(
  '/:id/users/:userId',
  validateParams(removeUserFromTaskSchema),
  clearCacheMw('/taskflow/tasks*'),
  clearCacheMw('/taskflow/projects*'),
  removeUserFromTask,
);

// Task Tags
router.get('/:id/tags', validateParams(getTaskSchema), getTaskTags);
router.post(
  '/:id/tags',
  validateBody(addTagsToTaskSchema),
  clearCacheMw('/taskflow/tasks*'),
  addTagsToTask,
);
router.delete(
  '/:id/tags/:tagId',
  validateParams(removeTagFromTaskSchema),
  clearCacheMw('/taskflow/tasks*'),
  removeTagFromTask,
);

export default router;
