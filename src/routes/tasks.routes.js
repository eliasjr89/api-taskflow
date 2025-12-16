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
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  addUsersToTaskSchema,
  addTagsToTaskSchema,
} from '../validators/taskValidator.js';
import Joi from 'joi';

const router = Router();

// ID validators
const idSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const userIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  userId: Joi.number().integer().positive().required(),
});

const tagIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  tagId: Joi.number().integer().positive().required(),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  project_id: Joi.number().integer().positive(),
  status_id: Joi.number().integer().positive(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  user_id: Joi.number().integer().positive(),
  tag_id: Joi.number().integer().positive(),
});

// Protect all routes
router.use(authMiddleware);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Obtener todas las tareas
 *     tags: [Tasks]
 */
router.get('/', validateQuery(querySchema), getAllTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Obtener tarea por ID
 *     tags: [Tasks]
 */
router.get('/:id', validateParams(idSchema), getTaskById);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Crear una nueva tarea
 *     tags: [Tasks]
 */
router.post('/', validateBody(createTaskSchema), createTask);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Actualizar tarea
 *     tags: [Tasks]
 */
router.put(
  '/:id',
  validateParams(idSchema),
  validateBody(updateTaskSchema),
  updateTask,
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Eliminar tarea
 *     tags: [Tasks]
 */
router.delete('/:id', validateParams(idSchema), deleteTask);

// Task Users
router.get('/:id/users', validateParams(idSchema), getTaskUsers);
router.post(
  '/:id/users',
  validateParams(idSchema),
  validateBody(addUsersToTaskSchema),
  addUsersToTask,
);
router.delete(
  '/:id/users/:userId',
  validateParams(userIdSchema),
  removeUserFromTask,
);

// Task Tags
router.get('/:id/tags', validateParams(idSchema), getTaskTags);
router.post(
  '/:id/tags',
  validateParams(idSchema),
  validateBody(addTagsToTaskSchema),
  addTagsToTask,
);
router.delete(
  '/:id/tags/:tagId',
  validateParams(tagIdSchema),
  removeTagFromTask,
);

export default router;
