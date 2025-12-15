import { Router } from "express";
import {
  getProfile,
  updateProfile,
  uploadUserAvatar,
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

export default router;
