// src/controllers/projectController.js
import * as ProjectService from '../services/projectService.js';
import * as AuditService from '../services/auditService.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getAllProjects = catchAsync(async (req, res) => {
  const projects = await ProjectService.getAllProjects();
  res.status(200).json({
    success: true,
    data: projects,
    message: 'Projects fetched successfully',
  });
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
  const project = await ProjectService.updateProject(req.params.id, req.body);
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
  await ProjectService.deleteProject(req.params.id);
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
