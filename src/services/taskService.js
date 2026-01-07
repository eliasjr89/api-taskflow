import { prisma } from '../lib/prisma.js';
import * as TaskRepository from '../repositories/taskRepository.js';
import * as WebhookService from '../services/webhookService.js';
import { AppError } from '../utils/AppError.js';

export const getAllTasks = async (filters = {}) => {
  // ... existing getAllTasks
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const { tasks, total } = await TaskRepository.findAll({
    ...filters,
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    results: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getTaskById = async (taskId) => {
  const task = await TaskRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  return task;
};

export const createTask = async (taskData) => {
  const task = await prisma.$transaction(
    async (tx) => {
      // 1. Validate Project
      if (taskData.project_id) {
        const projectExists = await TaskRepository.checkProjectExists(
          taskData.project_id,
          tx,
        );
        if (!projectExists) {
          throw new AppError('Project not found', 404);
        }
      }

      // 2. Validate Status (id 1 = 'pending' by default usually, but checking provided ID)
      if (taskData.status_id) {
        const statusExists = await TaskRepository.checkStatusExists(
          taskData.status_id,
          tx,
        );
        if (!statusExists) {
          throw new AppError('Status not found', 404);
        }
      }

      // 3. Create Task
      const newTask = await TaskRepository.create(taskData, tx);

      // 4. Assign Users if provided
      if (taskData.user_ids && Array.isArray(taskData.user_ids)) {
        await TaskRepository.addUsers(newTask.id, taskData.user_ids, tx);
      }

      return newTask;
    },
    {
      timeout: 10000,
    },
  );

  // Fetch complete task with relations to return
  const finalTask = await TaskRepository.findById(task.id);

  // Trigger Webhook (async, don't block)
  WebhookService.trigger('task.created', finalTask).catch((err) =>
    console.error('Webhook trigger failed', err.message),
  );

  return finalTask;
};

export const updateTask = async (taskId, taskData) => {
  const updatedTask = await prisma.$transaction(
    async (tx) => {
      // 1. Get current task
      const currentTask = await TaskRepository.findById(taskId, tx);
      if (!currentTask) {
        throw new AppError('Task not found', 404);
      }

      // 2. Validate Project if changing
      if (
        taskData.project_id &&
        taskData.project_id !== currentTask.project_id
      ) {
        const projectExists = await TaskRepository.checkProjectExists(
          taskData.project_id,
          tx,
        );
        if (!projectExists) {
          throw new AppError('Project not found', 404);
        }
      }

      // 3. Validate Status if changing
      if (taskData.status_id && taskData.status_id !== currentTask.status_id) {
        const statusExists = await TaskRepository.checkStatusExists(
          taskData.status_id,
          tx,
        );
        if (!statusExists) {
          throw new AppError('Status not found', 404);
        }
      }

      // 4. Update task
      const updated = await TaskRepository.update(taskId, taskData, tx);

      // 5. Update Assignments if provided
      if (taskData.user_ids && Array.isArray(taskData.user_ids)) {
        // Replace existing assignments
        await TaskRepository.removeAllUsers(taskId, tx);
        if (taskData.user_ids.length > 0) {
          await TaskRepository.addUsers(taskId, taskData.user_ids, tx);
        }
      }

      return updated;
    },
    {
      timeout: 10000,
    },
  );

  // Return fresh data with relations
  const finalTask = await TaskRepository.findById(updatedTask.id);

  // Trigger Webhook
  WebhookService.trigger('task.updated', finalTask).catch((err) =>
    console.error('Webhook trigger failed', err.message),
  );

  return finalTask;
};

export const deleteTask = async (taskId) => {
  await prisma.$transaction(
    async (tx) => {
      const task = await TaskRepository.findById(taskId, tx);
      if (!task) {
        throw new AppError('Task not found', 404);
      }

      // Soft delete: set deleted = true
      await TaskRepository.deleteSoft(taskId, tx);
    },
    {
      timeout: 10000,
    },
  );
};

export const addUsersToTask = async (taskId, userIds) => {
  const task = await TaskRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (userIds && userIds.length > 0) {
    // Check if users exist in DB (optional but good)
    const usersExist = await TaskRepository.checkUsersExist(userIds);
    if (!usersExist) {
      throw new AppError('One or more users not found', 404);
    }
    await TaskRepository.addUsers(taskId, userIds);
  }
};

export const removeUserFromTask = async (taskId, userId) => {
  const task = await TaskRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  await TaskRepository.removeUser(taskId, userId);
};

export const addTagsToTask = async (taskId, tagIds) => {
  const task = await TaskRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (tagIds && tagIds.length > 0) {
    // Check tags exist (optional)
    const tagsExist = await TaskRepository.checkTagsExist(tagIds);
    if (!tagsExist) {
      throw new AppError('One or more tags not found', 404);
    }
    await TaskRepository.addTags(taskId, tagIds);
  }
};

export const removeTagFromTask = async (taskId, tagId) => {
  const task = await TaskRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  await TaskRepository.removeTag(taskId, tagId);
};

export const getTaskUsers = async (taskId) => {
  const task = await TaskRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  return TaskRepository.getTaskUsers(taskId);
};

export const getTaskTags = async (taskId) => {
  const task = await TaskRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  return TaskRepository.getTaskTags(taskId);
};
