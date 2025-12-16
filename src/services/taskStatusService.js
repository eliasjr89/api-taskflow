// src/services/taskStatusService.js
import * as TaskStatusRepository from '../repositories/taskStatusRepository.js';
import { AppError } from '../utils/AppError.js';

export const getAllTaskStatuses = async () => {
  return await TaskStatusRepository.findAll();
};

export const getTaskStatusById = async (id) => {
  const status = await TaskStatusRepository.findById(id);
  if (!status) {
    throw new AppError('Task status not found', 404);
  }
  return status;
};

export const createTaskStatus = async (data) => {
  const existing = await TaskStatusRepository.findByName(data.name);
  if (existing) {
    throw new AppError('Task status name already exists', 409);
  }

  return await TaskStatusRepository.create(data.name);
};

export const updateTaskStatus = async (id, data) => {
  const status = await TaskStatusRepository.findById(id);
  if (!status) {
    throw new AppError('Task status not found', 404);
  }

  const existingName = await TaskStatusRepository.findByName(data.name);
  if (existingName && existingName.id !== parseInt(id)) {
    throw new AppError('Task status name already exists', 409);
  }

  return await TaskStatusRepository.update(id, data.name);
};

export const deleteTaskStatus = async (id) => {
  const status = await TaskStatusRepository.findById(id);
  if (!status) {
    throw new AppError('Task status not found', 404);
  }

  // Note: tasks_statuses usually have integrity constraints (tasks refer to it).
  // If we delete, it naturally fails or cascades. Assuming DB integrity for now.
  // We can add check if tasks exist with this status.

  return await TaskStatusRepository.deleteById(id);
};
