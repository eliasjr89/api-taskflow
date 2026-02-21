// src/controllers/taskController.js
import * as TaskService from '../services/taskService.js';
import * as AuditService from '../services/auditService.js';
import { catchAsync } from '../utils/catchAsync.js';
import { getIO } from '../lib/socket.js';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

export const getAllTasks = catchAsync(async (req, res) => {
  const filters = { ...req.query };

  // If user is not admin/manager, only show their own tasks
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    filters.user_id = req.user.userId;
  }

  const result = await TaskService.getAllTasks(filters);
  const responseData = {
    success: true,
    message: 'Tasks fetched successfully',
    data: result.results,
    pagination: result.pagination,
  };

  const redisClient = getRedisClient();
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.set(req.originalUrl, JSON.stringify(responseData), {
        EX: 300,
      });
    } catch (err) {
      logger.error('[Redis] Fallo guardando en Cache:', err);
    }
  }

  res.status(200).json(responseData);
});

export const getTaskById = catchAsync(async (req, res) => {
  const task = await TaskService.getTaskById(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Task fetched successfully',
    data: task,
  });
});

export const createTask = catchAsync(async (req, res) => {
  const task = await TaskService.createTask(req.body);

  await AuditService.logAction({
    userId: req.user.userId,
    action: 'CREATE_TASK',
    entityType: 'TASK',
    entityId: task.id,
    details: { description: task.description, project_id: task.project_id },
    req,
  });

  // Emit Socket Event
  try {
    const io = getIO();
    io.emit('task:created', task);
  } catch (err) {
    console.error('Socket emit failed:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: task,
  });
});

export const updateTask = catchAsync(async (req, res) => {
  const task = await TaskService.updateTask(req.params.id, req.body);

  // Check if task was completed
  const isCompleted = req.body.status_id === 3 || req.body.completed === true;

  await AuditService.logAction({
    userId: req.user.userId,
    action: isCompleted ? 'COMPLETE_TASK' : 'UPDATE_TASK',
    entityType: 'TASK',
    entityId: task.id,
    details: req.body,
    req,
  });

  // Emit Socket Event
  try {
    const io = getIO();
    io.emit('task:updated', task);
  } catch (err) {
    console.error('Socket emit failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: task,
  });
});

export const deleteTask = catchAsync(async (req, res) => {
  await TaskService.deleteTask(req.params.id);

  await AuditService.logAction({
    userId: req.user.userId,
    action: 'DELETE_TASK',
    entityType: 'TASK',
    entityId: req.params.id,
    details: {},
    req,
  });

  // Emit Socket Event
  try {
    const io = getIO();
    io.emit('task:deleted', req.params.id);
  } catch (err) {
    console.error('Socket emit failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
    data: null,
  });
});

export const addUsersToTask = catchAsync(async (req, res) => {
  await TaskService.addUsersToTask(req.params.id, req.body.user_ids);
  res.status(200).json({ success: true, message: 'Users added to task' });
});

export const removeUserFromTask = catchAsync(async (req, res) => {
  await TaskService.removeUserFromTask(req.params.id, req.params.userId);
  res.status(200).json({ success: true, message: 'User removed from task' });
});

export const addTagsToTask = catchAsync(async (req, res) => {
  await TaskService.addTagsToTask(req.params.id, req.body.tag_ids);
  res.status(200).json({ success: true, message: 'Tags added to task' });
});

export const removeTagFromTask = catchAsync(async (req, res) => {
  await TaskService.removeTagFromTask(req.params.id, req.params.tagId);
  res.status(200).json({ success: true, message: 'Tag removed from task' });
});

export const getTaskUsers = catchAsync(async (req, res) => {
  const users = await TaskService.getTaskUsers(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Task users fetched successfully',
    data: users,
  });
});

export const getTaskTags = catchAsync(async (req, res) => {
  const tags = await TaskService.getTaskTags(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Task tags fetched successfully',
    data: tags,
  });
});
