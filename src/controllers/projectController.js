// src/controllers/projectController.js
import * as ProjectService from "../services/projectService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getAllProjects = catchAsync(async (req, res) => {
  const projects = await ProjectService.getAllProjects();
  res.status(200).json({
    success: true,
    data: projects,
    message: "Projects fetched successfully",
  });
});

export const getProjectById = catchAsync(async (req, res) => {
  const project = await ProjectService.getProjectById(req.params.id);
  res.status(200).json({
    success: true,
    data: project,
    message: "Project fetched successfully",
  });
});

export const createProject = catchAsync(async (req, res) => {
  const project = await ProjectService.createProject(req.body, req.user.userId);
  res.status(201).json({
    success: true,
    data: project,
    message: "Project created successfully",
  });
});

export const updateProject = catchAsync(async (req, res) => {
  const project = await ProjectService.updateProject(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: project,
    message: "Project updated successfully",
  });
});

export const deleteProject = catchAsync(async (req, res) => {
  await ProjectService.deleteProject(req.params.id);
  res.status(200).json({
    success: true,
    data: null,
    message: "Project deleted successfully",
  });
});

// Member management
export const getProjectUsers = catchAsync(async (req, res) => {
  const users = await ProjectService.getProjectUsers(req.params.id);
  res.status(200).json({
    success: true,
    data: users,
    message: "Project users fetched successfully",
  });
});

export const addUsersToProject = catchAsync(async (req, res) => {
  await ProjectService.addUsersToProject(req.params.id, req.body.user_ids);
  res.status(200).json({
    success: true,
    message: "Users added to project",
  });
});

export const removeUserFromProject = catchAsync(async (req, res) => {
  await ProjectService.removeUserFromProject(req.params.id, req.params.userId);
  res.status(200).json({
    success: true,
    message: "User removed from project",
  });
});
