// src/routes/projects.routes.js
import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectUsers,
  getProjectTasks,
  addUsersToProject,
  removeUserFromProject,
} from '../controllers/projectController.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validate.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addUsersToProjectSchema,
} from '../validators/projectValidator.js';
import Joi from 'joi';

// Simple ID validator
const idSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const userIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  userId: Joi.number().integer().positive().required(),
});

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Gestión de proyectos
 */
router.use(authMiddleware);

// Projects CRUD
/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Obtener todos los proyectos
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Lista de proyectos
 */
router.get('/', getAllProjects);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Obtener proyecto por ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proyecto encontrado
 *       404:
 *         description: Proyecto no encontrado
 */
router.get('/:id', validateParams(idSchema), getProjectById);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Crear nuevo proyecto
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Proyecto creado
 */
router.post('/', validateBody(createProjectSchema), createProject);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Actualizar proyecto
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 */
router.put(
  '/:id',
  validateParams(idSchema),
  validateBody(updateProjectSchema),
  updateProject,
);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Eliminar proyecto
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proyecto eliminado
 */
router.delete('/:id', validateParams(idSchema), deleteProject);

// Project Members
router.get('/:id/users', validateParams(idSchema), getProjectUsers);
router.post(
  '/:id/users',
  validateParams(idSchema),
  validateBody(addUsersToProjectSchema),
  addUsersToProject,
);
router.delete(
  '/:id/users/:userId',
  validateParams(userIdSchema),
  removeUserFromProject,
);

// Project Tasks
/**
 * @swagger
 * /projects/{id}/tasks:
 *   get:
 *     summary: Obtener tareas del proyecto
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de tareas del proyecto
 *       404:
 *         description: Proyecto no encontrado
 */
router.get('/:id/tasks', validateParams(idSchema), getProjectTasks);

export default router;
