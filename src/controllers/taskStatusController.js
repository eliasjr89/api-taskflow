// src/controllers/taskStatusController.js
import * as TaskStatusService from "../services/taskStatusService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getAllTaskStatuses = catchAsync(async (req, res) => {
  const statuses = await TaskStatusService.getAllTaskStatuses();
  res.status(200).json({
    success: true,
    data: statuses,
    message: "Task statuses fetched successfully",
  });
});

export const getTaskStatusById = catchAsync(async (req, res) => {
  const status = await TaskStatusService.getTaskStatusById(req.params.id);
  res.status(200).json({
    success: true,
    data: status,
    message: "Task status fetched successfully",
  });
});

export const createTaskStatus = catchAsync(async (req, res) => {
  const status = await TaskStatusService.createTaskStatus(req.body);
  res.status(201).json({
    success: true,
    data: status,
    message: "Task status created successfully",
  });
});

export const updateTaskStatus = catchAsync(async (req, res) => {
  const status = await TaskStatusService.updateTaskStatus(
    req.params.id,
    req.body
  );
  res.status(200).json({
    success: true,
    data: status,
    message: "Task status updated successfully",
  });
});

export const deleteTaskStatus = catchAsync(async (req, res) => {
  await TaskStatusService.deleteTaskStatus(req.params.id);
  res.status(200).json({
    success: true,
    data: null,
    message: "Task status deleted successfully",
  });
});
