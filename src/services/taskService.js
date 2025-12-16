// src/services/taskService.js
import { pool } from '../db/database.js';
import * as TaskRepository from '../repositories/taskRepository.js';
import { AppError } from '../utils/AppError.js';

export const getAllTasks = async (filters) => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  const { tasks, total } = await TaskRepository.findAll({
    ...filters,
    limit,
    offset,
  });

  return {
    results: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTaskById = async (id) => {
  const task = await TaskRepository.findById(id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  return task;
};

export const createTask = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validations
    const projectExists = await TaskRepository.checkProjectExists(
      data.project_id,
      client,
    );
    if (!projectExists) {
      throw new AppError('Project not found', 404);
    }

    const statusExists = await TaskRepository.checkStatusExists(
      data.status_id,
      client,
    );
    if (!statusExists) {
      throw new AppError('Status not found', 404);
    }

    if (
      data.user_ids &&
      !(await TaskRepository.checkUsersExist(data.user_ids, client))
    ) {
      throw new AppError('One or more users not found', 404);
    }
    if (
      data.tag_ids &&
      !(await TaskRepository.checkTagsExist(data.tag_ids, client))
    ) {
      throw new AppError('One or more tags not found', 404);
    }

    // Create Task
    const newTask = await TaskRepository.create(data, client);

    // Relations
    if (data.user_ids && data.user_ids.length > 0) {
      await TaskRepository.addUsers(newTask.id, data.user_ids, client);
    }
    if (data.tag_ids && data.tag_ids.length > 0) {
      await TaskRepository.addTags(newTask.id, data.tag_ids, client);
    }

    await client.query('COMMIT');
    // Return full task with relations
    return await TaskRepository.findById(newTask.id); // Uses default pool, it's fine as committed
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateTask = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check existence
    const existingTask = await TaskRepository.findById(id, client);
    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    if (
      data.user_ids &&
      !(await TaskRepository.checkUsersExist(data.user_ids, client))
    ) {
      throw new AppError('One or more users not found', 404);
    }

    if (
      data.tag_ids &&
      !(await TaskRepository.checkTagsExist(data.tag_ids, client))
    ) {
      throw new AppError('One or more tags not found', 404);
    }

    // Update Task
    await TaskRepository.update(id, data, client);

    // Update Relations
    if (data.user_ids) {
      await TaskRepository.removeAllUsers(id, client);
      if (data.user_ids.length > 0) {
        await TaskRepository.addUsers(id, data.user_ids, client);
      }
    }
    if (data.tag_ids) {
      await TaskRepository.removeAllTags(id, client);
      if (data.tag_ids.length > 0) {
        await TaskRepository.addTags(id, data.tag_ids, client);
      }
    }

    await client.query('COMMIT');
    return await TaskRepository.findById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteTask = async (id) => {
  const deletedTask = await TaskRepository.deleteById(id);
  if (!deletedTask) {
    throw new AppError('Task not found', 404);
  }
  return deletedTask;
};

export const addUsersToTask = async (id, userIds) => {
  const task = await TaskRepository.findById(id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (!(await TaskRepository.checkUsersExist(userIds))) {
    throw new AppError('One or more users not found', 400);
  }
  await TaskRepository.addUsers(id, userIds);
};

export const removeUserFromTask = async (id, userId) => {
  const task = await TaskRepository.findById(id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  await TaskRepository.removeUser(id, userId);
};

export const addTagsToTask = async (id, tagIds) => {
  const task = await TaskRepository.findById(id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (!(await TaskRepository.checkTagsExist(tagIds))) {
    throw new AppError('One or more tags not found', 400);
  }
  await TaskRepository.addTags(id, tagIds);
};

export const removeTagFromTask = async (id, tagId) => {
  const task = await TaskRepository.findById(id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  await TaskRepository.removeTag(id, tagId);
};

export const getTaskUsers = async (id) => {
  const task = await TaskRepository.findById(id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  return await TaskRepository.getTaskUsers(id);
};

export const getTaskTags = async (id) => {
  const task = await TaskRepository.findById(id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  return await TaskRepository.getTaskTags(id);
};
