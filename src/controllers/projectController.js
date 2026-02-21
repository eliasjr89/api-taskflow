import * as ProjectService from '../services/projectService.js';
import * as AuditService from '../services/auditService.js';
import { catchAsync } from '../utils/catchAsync.js';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

export const getAllProjects = catchAsync(async (req, res) => {
  const result = await ProjectService.getAllProjects(req.query);

  const responseData = {
    success: true,
    data: result.results,
    pagination: result.pagination,
    message: 'Projects fetched successfully',
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

export const getProjectById = catchAsync(async (req, res) => {
  const project = await ProjectService.getProjectById(req.params.id);
  res.status(200).json({
    success: true,
    data: project,
    message: 'Project fetched successfully',
  });
});

export const createProject = catchAsync(async (req, res) => {
  const project = await ProjectService.createProject(req.body, req.user.userId);
  await AuditService.logAction({
    userId: req.user.userId,
    action: 'CREATE_PROJECT',
    entityType: 'PROJECT',
    entityId: project.id,
    details: { name: project.name },
    req,
  });
  res.status(201).json({
    success: true,
    data: project,
    message: 'Project created successfully',
  });
});

export const updateProject = catchAsync(async (req, res) => {
  const project = await ProjectService.updateProject(
    req.params.id,
    req.body,
    req.user,
  );
  await AuditService.logAction({
    userId: req.user.userId,
    action: 'UPDATE_PROJECT',
    entityType: 'PROJECT',
    entityId: project.id,
    details: req.body,
    req,
  });
  res.status(200).json({
    success: true,
    data: project,
    message: 'Project updated successfully',
  });
});

export const deleteProject = catchAsync(async (req, res) => {
  await ProjectService.deleteProject(req.params.id, req.user);
  await AuditService.logAction({
    userId: req.user.userId,
    action: 'DELETE_PROJECT',
    entityType: 'PROJECT',
    entityId: req.params.id,
    details: {},
    req,
  });
  res.status(200).json({
    success: true,
    data: null,
    message: 'Project deleted successfully',
  });
});

// Member management
export const getProjectUsers = catchAsync(async (req, res) => {
  const users = await ProjectService.getProjectUsers(req.params.id);
  res.status(200).json({
    success: true,
    data: users,
    message: 'Project users fetched successfully',
  });
});

export const addUsersToProject = catchAsync(async (req, res) => {
  await ProjectService.addUsersToProject(req.params.id, req.body.user_ids);

  await AuditService.logAction({
    userId: req.user.userId,
    action: 'ADD_PROJECT_MEMBERS',
    entityType: 'PROJECT',
    entityId: req.params.id,
    details: { added_users: req.body.user_ids },
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Users added to project',
  });
});

export const removeUserFromProject = catchAsync(async (req, res) => {
  await ProjectService.removeUserFromProject(req.params.id, req.params.userId);
  res.status(200).json({
    success: true,
    message: 'User removed from project',
  });
});

// Get project tasks
export const getProjectTasks = catchAsync(async (req, res) => {
  const tasks = await ProjectService.getProjectTasks(req.params.id);
  res.status(200).json({
    success: true,
    data: tasks,
    message: 'Project tasks fetched successfully',
  });
});
export const deleteEmptyProjects = catchAsync(async (req, res) => {
  const count = await ProjectService.deleteEmptyProjects();

  await AuditService.logAction({
    userId: req.user.userId,
    action: 'CLEAN_EMPTY_PROJECTS',
    entityType: 'PROJECT',
    entityId: 0,
    details: { deleted_count: count },
    req,
  });

  res.status(200).json({
    success: true,
    message: `${count} empty projects deleted successfully`,
    data: { deleted_count: count },
  });
});
