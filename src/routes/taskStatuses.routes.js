// src/routes/taskStatuses.routes.js
import { Router } from "express";
import {
  getAllTaskStatuses,
  getTaskStatusById,
  createTaskStatus,
  updateTaskStatus,
  deleteTaskStatus,
} from "../controllers/taskStatusController.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createTaskStatusSchema,
  updateTaskStatusSchema,
  getTaskStatusSchema,
} from "../schemas/taskStatus.schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TaskStatuses
 *   description: Gestión de estados de tareas
 */
router.use(authMiddleware);

/**
 * @swagger
 * /task-statuses:
 *   get:
 *     summary: Obtener todos los estados
 *     tags: [TaskStatuses]
 *     responses:
 *       200:
 *         description: Lista de estados
 */
router.get("/", getAllTaskStatuses);

/**
 * @swagger
 * /task-statuses/{id}:
 *   get:
 *     summary: Obtener estado por ID
 *     tags: [TaskStatuses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado encontrado
 */
router.get("/:id", validate(getTaskStatusSchema), getTaskStatusById);

/**
 * @swagger
 * /task-statuses:
 *   post:
 *     summary: Crear nuevo estado
 *     tags: [TaskStatuses]
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
 *     responses:
 *       201:
 *         description: Estado creado
 */
router.post("/", validate(createTaskStatusSchema), createTaskStatus);

/**
 * @swagger
 * /task-statuses/{id}:
 *   put:
 *     summary: Actualizar estado
 *     tags: [TaskStatuses]
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
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put("/:id", validate(updateTaskStatusSchema), updateTaskStatus);

/**
 * @swagger
 * /task-statuses/{id}:
 *   delete:
 *     summary: Eliminar estado
 *     tags: [TaskStatuses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado eliminado
 */
router.delete("/:id", validate(getTaskStatusSchema), deleteTaskStatus);

export default router;
