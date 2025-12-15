// src/routes/tasks.routes.js
import { Router } from "express";
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
} from "../controllers/taskController.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  getTasksQuerySchema,
  addUsersToTaskSchema,
  removeUserFromTaskSchema,
  addTagsToTaskSchema,
  removeTagFromTaskSchema,
} from "../schemas/task.schema.js";

const router = Router();

// Protect all routes
/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Gestión de tareas
 */

router.use(authMiddleware);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Obtener todas las tareas
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de tareas por página
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filtrar por proyecto
 *     responses:
 *       200:
 *         description: Lista de tareas recuperada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 */
router.get("/", validate(getTasksQuerySchema), getAllTasks);
/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Obtener tarea por ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tarea encontrada
 *       404:
 *         description: Tarea no encontrada
 */
router.get("/:id", validate(getTaskSchema), getTaskById);
/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Crear una nueva tarea
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - project_id
 *               - status_id
 *             properties:
 *               description:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               status_id:
 *                 type: integer
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               due_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tarea creada exitosamente
 */
router.post("/", validate(createTaskSchema), createTask);
/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Actualizar tarea
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               status_id:
 *                 type: integer
 *               priority:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tarea actualizada
 *       404:
 *         description: Tarea no encontrada
 */
router.put("/:id", validate(updateTaskSchema), updateTask);
/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Eliminar tarea (Soft Delete)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tarea eliminada
 *       404:
 *         description: Tarea no encontrada
 */
router.delete("/:id", validate(getTaskSchema), deleteTask);

// Task Members
/**
 * @swagger
 * /tasks/{id}/users:
 *   get:
 *     summary: Obtener usuarios asignados a la tarea
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de usuarios de la tarea
 *       404:
 *         description: Tarea no encontrada
 */
router.get("/:id/users", validate(getTaskSchema), getTaskUsers);
router.post("/:id/users", validate(addUsersToTaskSchema), addUsersToTask);
router.delete(
  "/:id/users/:userId",
  validate(removeUserFromTaskSchema),
  removeUserFromTask
);

// Task Tags
/**
 * @swagger
 * /tasks/{id}/tags:
 *   get:
 *     summary: Obtener etiquetas de la tarea
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de etiquetas de la tarea
 *       404:
 *         description: Tarea no encontrada
 */
router.get("/:id/tags", validate(getTaskSchema), getTaskTags);
router.post("/:id/tags", validate(addTagsToTaskSchema), addTagsToTask);
router.delete(
  "/:id/tags/:tagId",
  validate(removeTagFromTaskSchema),
  removeTagFromTask
);

export default router;
