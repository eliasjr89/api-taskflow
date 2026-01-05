// src/routes/users.routes.js
import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../middleware/upload.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validate.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
} from '../schemas/user.schema.js';

const router = Router();

// ID validator

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */
router.use(authMiddleware);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Users]
 */
router.get('/', getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 */
router.get('/:id', validateParams(getUserSchema), getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear nuevo usuario
 *     tags: [Users]
 */
router.post(
  '/',
  uploadAvatar.single('profile_image'),
  validateBody(createUserSchema),
  createUser,
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Users]
 */
router.put(
  '/:id',
  uploadAvatar.single('profile_image'),
  validateParams(getUserSchema),
  validateBody(updateUserSchema),
  updateUser,
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Users]
 */
router.delete('/:id', validateParams(getUserSchema), deleteUser);

export default router;
