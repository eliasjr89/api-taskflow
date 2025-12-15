import { Router } from "express";
import {
  getProfile,
  updateProfile,
  uploadUserAvatar,
  getUserProjects,
  getUserTasks,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import { z } from "zod";

const router = Router();

const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).optional(),
    name: z.string().optional(),
    lastname: z.string().optional(),
    email: z.string().email().optional(),
    profile_image: z.string().url().optional().nullable(),
  }),
});

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 */
router.get("/profile", authMiddleware, getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               name:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *               profile_image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado
 */
router.put(
  "/profile",
  authMiddleware,
  validate(updateProfileSchema),
  updateProfile
);

/**
 * @swagger
 * /user/avatar:
 *   post:
 *     summary: Subir imagen de perfil
 *     tags: [Profile]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar actualizado
 */
router.post(
  "/avatar",
  authMiddleware,
  uploadAvatar.single("avatar"),
  uploadUserAvatar
);

/**
 * @swagger
 * /user/projects:
 *   get:
 *     summary: Obtener proyectos del usuario autenticado
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       creator_username:
 *                         type: string
 *                       num_tasks:
 *                         type: integer
 */
router.get("/projects", authMiddleware, getUserProjects);

/**
 * @swagger
 * /user/tasks:
 *   get:
 *     summary: Obtener tareas del usuario autenticado
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tareas asignadas al usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       description:
 *                         type: string
 *                       project_name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       priority:
 *                         type: string
 *                       completed:
 *                         type: boolean
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: object
 */
router.get("/tasks", authMiddleware, getUserTasks);

export default router;
