// src/controllers/userController.js
import * as UserService from '../services/userService.js';
import * as UserRepository from '../repositories/userRepository.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import * as AuditService from '../services/auditService.js';
import bcrypt from 'bcrypt';

// Para rutas de perfil autenticado
export const getProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const user = await UserService.getUserById(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const updatedUser = await UserService.updateUser(userId, req.body);

  await AuditService.logAction({
    userId,
    action: 'UPDATE_PROFILE',
    entityType: 'USER',
    entityId: userId,
    details: req.body,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});

export const uploadUserAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const userId = req.user.userId;

  // Convert buffer to Base64
  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const mimeType = req.file.mimetype;
  const avatarUrl = `data:${mimeType};base64,${b64}`;

  const updatedUser = await UserService.updateUser(userId, {
    profile_image: avatarUrl,
  });

  await AuditService.logAction({
    userId,
    action: 'UPLOAD_AVATAR',
    entityType: 'USER',
    entityId: userId,
    details: { size: req.file.size, mimeType },
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      imageUrl: avatarUrl,
      user: updatedUser,
    },
  });
});

// Para rutas de administración de usuarios
export const getAllUsers = catchAsync(async (req, res) => {
  const users = await UserRepository.findAll();
  res.status(200).json({
    success: true,
    data: users,
  });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const createUser = catchAsync(async (req, res) => {
  const { username, email, password, name, lastname } = req.body;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await UserRepository.create({
    username,
    email,
    password: hashedPassword,
    name,
    lastname,
  });

  await AuditService.logAction({
    userId: req.user.userId, // Admin creating it (assuming this route is protected)
    action: 'CREATE_USER',
    entityType: 'USER',
    entityId: newUser.id,
    details: { username, email, role: newUser.role },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser,
  });
});

export const updateUser = catchAsync(async (req, res) => {
  const updatedUser = await UserService.updateUser(req.params.id, req.body);

  await AuditService.logAction({
    userId: req.user.userId,
    action: 'UPDATE_USER',
    entityType: 'USER',
    entityId: req.params.id,
    details: req.body,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser,
  });
});

export const deleteUser = catchAsync(async (req, res) => {
  await UserRepository.deleteById(req.params.id);

  await AuditService.logAction({
    userId: req.user.userId,
    action: 'DELETE_USER',
    entityType: 'USER',
    entityId: req.params.id,
    details: {},
    req,
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Obtener proyectos del usuario autenticado
export const getUserProjects = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT DISTINCT p.id, p.name, p.description, p.created_at, p.updated_at,
           u.username AS creator_username,
           COUNT(DISTINCT t.id) AS num_tasks
    FROM projects p
    LEFT JOIN users u ON p.creator_id = u.id
    LEFT JOIN projects_users pu ON p.id = pu.project_id
    LEFT JOIN tasks t ON p.id = t.project_id AND t.deleted = false
    WHERE p.creator_id = $1 OR pu.user_id = $1
    GROUP BY p.id, u.username
    ORDER BY p.created_at DESC
  `;

  const result = await UserRepository.pool.query(query, [userId]);

  res.status(200).json({
    success: true,
    message: 'User projects fetched successfully',
    data: result.rows,
  });
});

// Obtener tareas del usuario autenticado
export const getUserTasks = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT t.*, ts.name AS status,
           p.name AS project_name,
           json_agg(DISTINCT jsonb_build_object('id', tag.id, 'name', tag.name)) FILTER (WHERE tag.id IS NOT NULL) AS tags
    FROM tasks t
    LEFT JOIN task_statuses ts ON t.status_id = ts.id
    LEFT JOIN projects p ON t.project_id = p.id
    INNER JOIN tasks_users tu ON t.id = tu.task_id
    LEFT JOIN tasks_tags tt ON t.id = tt.task_id
    LEFT JOIN tags tag ON tt.tag_id = tag.id
    WHERE tu.user_id = $1 AND t.deleted = false
    GROUP BY t.id, ts.name, p.name
    ORDER BY t.created_at DESC
  `;

  const result = await UserRepository.pool.query(query, [userId]);

  res.status(200).json({
    success: true,
    message: 'User tasks fetched successfully',
    data: result.rows,
  });
});
