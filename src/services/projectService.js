// src/services/projectService.js
import { pool } from "../db/database.js";
import * as ProjectRepository from "../repositories/projectRepository.js";
import { AppError } from "../utils/AppError.js";

export const getAllProjects = async () => {
  return await ProjectRepository.findAll();
};

export const getProjectById = async (id) => {
  const project = await ProjectRepository.findById(id);
  if (!project) throw new AppError("Project not found", 404);

  project.users = await ProjectRepository.getProjectUsers(id);
  project.tasks = await ProjectRepository.getProjectTasks(id);

  return project;
};

export const createProject = async (data, creatorId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (
      data.user_ids &&
      !(await ProjectRepository.checkUsersExist(data.user_ids, client))
    ) {
      throw new AppError("One or more user_ids do not exist", 400);
    }

    const project = await ProjectRepository.create(data, creatorId, client);

    // Add creator + users
    const userSet = new Set(data.user_ids || []);
    userSet.add(creatorId);

    await ProjectRepository.addUsers(project.id, Array.from(userSet), client);

    await client.query("COMMIT");
    // Could fetch full proj but let's return created object
    return project;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateProject = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingProject = await ProjectRepository.findById(id, client);
    if (!existingProject) throw new AppError("Project not found", 404);

    const updated = await ProjectRepository.update(id, data, client);

    if (data.user_ids) {
      if (!(await ProjectRepository.checkUsersExist(data.user_ids, client))) {
        throw new AppError("One or more user_ids do not exist", 400);
      }

      // Replace users strategy
      await ProjectRepository.removeAllUsers(id, client);

      const userSet = new Set(data.user_ids);
      userSet.add(existingProject.creator_id); // Ensure creator stays? Typically yes.

      await ProjectRepository.addUsers(id, Array.from(userSet), client);
    }

    await client.query("COMMIT");
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteProject = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clean relations
    await ProjectRepository.removeAllUsers(id, client);
    // Tasks are usually soft deleted or cascaded?
    // The previous controller didn't explicitly delete tasks, but DB FK might not cascade.
    // Assuming standard cascade or manual cleanup:
    // "DELETE FROM tasks WHERE project_id=$1" - not in original controller, let's leave it for now (tasks might become orphaned or DB handles it).
    // Original controller only deleted projects_users.

    const deleted = await ProjectRepository.deleteById(id, client);
    if (!deleted) throw new AppError("Project not found", 404);

    await client.query("COMMIT");
    return deleted;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const addUsersToProject = async (id, userIds) => {
  // Basic existence checks
  const project = await ProjectRepository.findById(id);
  if (!project) throw new AppError("Project not found", 404);

  if (userIds.length > 0) {
    if (!(await ProjectRepository.checkUsersExist(userIds)))
      throw new AppError("One or more users not found", 400);
    await ProjectRepository.addUsers(id, userIds);
  }
};

export const removeUserFromProject = async (id, userId) => {
  const project = await ProjectRepository.findById(id);
  if (!project) throw new AppError("Project not found", 404);

  await ProjectRepository.removeUser(id, userId);
};

export const getProjectUsers = async (id) => {
  const project = await ProjectRepository.findById(id);
  if (!project) throw new AppError("Project not found", 404);
  return await ProjectRepository.getProjectUsers(id);
};
