// src/routes/tags.routes.js
import { Router } from 'express';
import {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} from '../controllers/tagsController.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTagSchema,
  updateTagSchema,
  getTagSchema,
} from '../schemas/tag.schema.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: Gestión de etiquetas
 */
router.use(authMiddleware);

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Obtener todas las etiquetas
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Lista de etiquetas
 */
router.get('/', getAllTags);

/**
 * @swagger
 * /tags/{id}:
 *   get:
 *     summary: Obtener etiqueta por ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Etiqueta encontrada
 */
router.get('/:id', validate(getTagSchema), getTagById);

/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Crear nueva etiqueta
 *     tags: [Tags]
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
 *         description: Etiqueta creada
 */
router.post('/', validate(createTagSchema), createTag);

/**
 * @swagger
 * /tags/{id}:
 *   put:
 *     summary: Actualizar etiqueta
 *     tags: [Tags]
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
 *         description: Etiqueta actualizada
 */
router.put('/:id', validate(updateTagSchema), updateTag);

/**
 * @swagger
 * /tags/{id}:
 *   delete:
 *     summary: Eliminar etiqueta
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Etiqueta eliminada
 */
router.delete('/:id', validate(getTagSchema), deleteTag);

export default router;
