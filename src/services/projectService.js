// src/services/projectService.js
import { prisma } from '../lib/prisma.js';
import * as ProjectRepository from '../repositories/projectRepository.js';
import { AppError } from '../utils/AppError.js';

export const getAllProjects = async () => {
  return await ProjectRepository.findAll();
};

export const getProjectById = async (id) => {
  const project = await ProjectRepository.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  // No need to fetch manually if repo already transformed, but Repo 'findById' uses 'transformProject' via Prisma include
  // But wait, 'findById' in repo now returns the object. Does it include 'users' field?
  // Previous Code had 'project.users = await getProjectUsers...'.
  // Prisma `include` doesn't transform nicely to flat 'users' array unless mapped.
  // The 'transformProject' helper didn't add 'users' array, just counts.
  // So we still need to fetch users/tasks separately to match legacy response if consumer expects them.
  // But legacy 'findById' did:
  /*
  project.users = await ProjectRepository.getProjectUsers(id);
  project.tasks = await ProjectRepository.getProjectTasks(id);
  */
  // So we should keep doing this.
  project.users = await ProjectRepository.getProjectUsers(id);
  project.tasks = await ProjectRepository.getProjectTasks(id);

  return project;
};

export const createProject = async (data, creatorId) => {
  return await prisma.$transaction(
    async (tx) => {
      if (
        data.user_ids &&
        !(await ProjectRepository.checkUsersExist(data.user_ids, tx))
      ) {
        throw new AppError('One or more user_ids do not exist', 400);
      }

      const project = await ProjectRepository.create(data, creatorId, tx);

      // Add creator + users
      const userSet = new Set(data.user_ids || []);
      userSet.add(creatorId);

      await ProjectRepository.addUsers(project.id, Array.from(userSet), tx);

      return project;
    },
    {
      timeout: 10000,
    },
  );
};

export const updateProject = async (id, data, user) => {
  return await prisma.$transaction(
    async (tx) => {
      const existingProject = await ProjectRepository.findById(id, tx);
      if (!existingProject) {
        throw new AppError('Project not found', 404);
      }

      const userId = user.id || user.userId;
      const isAdmin =
        user.role === 'admin' ||
        (user.permissions && user.permissions.includes('manage:all'));
      const isManager = user.role === 'manager';

      // Check membership
      const membership = await tx.projectsOnUsers.findUnique({
        where: {
          projectId_userId: {
            projectId: Number(id),
            userId: Number(userId),
          },
        },
      });

      // IDOR Protection: Only creator, admin/manager, or member can update
      if (
        userId &&
        existingProject.creator_id !== userId &&
        !isAdmin &&
        !isManager &&
        !membership
      ) {
        throw new AppError(
          'You do not have permission to update this project',
          403,
        );
      }

      const updated = await ProjectRepository.update(id, data, tx);

      if (data.user_ids) {
        if (!(await ProjectRepository.checkUsersExist(data.user_ids, tx))) {
          throw new AppError('One or more user_ids do not exist', 400);
        }

        // Replace users strategy
        await ProjectRepository.removeAllUsers(id, tx);

        const userSet = new Set(data.user_ids);
        userSet.add(existingProject.creator_id); // Ensure creator stays

        await ProjectRepository.addUsers(id, Array.from(userSet), tx);
      }
      return updated;
    },
    {
      timeout: 10000,
    },
  );
};

export const deleteProject = async (id, user) => {
  return await prisma.$transaction(
    async (tx) => {
      // Clean relations
      const existingProject = await ProjectRepository.findById(id, tx);
      if (!existingProject) {
        throw new AppError('Project not found', 404);
      }

      const userId = user.id || user.userId;
      const isAdmin =
        user.role === 'admin' ||
        (user.permissions && user.permissions.includes('manage:all'));

      if (userId && existingProject.creator_id !== userId && !isAdmin) {
        throw new AppError(
          'You do not have permission to delete this project',
          403,
        );
      }

      await ProjectRepository.removeAllUsers(id, tx);
      await ProjectRepository.removeAllUsers(id, tx);
      // Tasks are handled by DB cascade or orphaned. Legacy code didn't delete them explicitely.

      const deleted = await ProjectRepository.deleteById(id, tx);
      if (!deleted) {
        throw new AppError('Project not found', 404);
      }
      return deleted;
    },
    {
      timeout: 10000,
    },
  );
};

export const addUsersToProject = async (id, userIds) => {
  // Basic existence checks - no transaction strictly needed if just adding
  const project = await ProjectRepository.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (userIds.length > 0) {
    if (!(await ProjectRepository.checkUsersExist(userIds))) {
      throw new AppError('One or more users not found', 400);
    }
    await ProjectRepository.addUsers(id, userIds);
  }
};

export const removeUserFromProject = async (id, userId) => {
  const project = await ProjectRepository.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  await ProjectRepository.removeUser(id, userId);
};

export const getProjectUsers = async (id) => {
  const project = await ProjectRepository.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  return await ProjectRepository.getProjectUsers(id);
};

export const getProjectTasks = async (id) => {
  const project = await ProjectRepository.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  return await ProjectRepository.getProjectTasks(id);
};
