// src/repositories/projectRepository.js
import { pool } from "../db/database.js";

export const findAll = async (client = pool) => {
  const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.created_at,
        u.username AS creator_username,
        COUNT(DISTINCT pu.user_id) AS num_collaborators,
        COUNT(DISTINCT t.id) AS num_tasks
      FROM projects p
      LEFT JOIN users u ON p.creator_id = u.id
      LEFT JOIN projects_users pu ON p.id = pu.project_id
      LEFT JOIN tasks t ON p.id = t.project_id AND t.deleted = false
      GROUP BY p.id, u.username
      ORDER BY p.id ASC
    `;
  const result = await client.query(query);
  return result.rows;
};

export const findById = async (id, client = pool) => {
  const query = `
      SELECT p.*, u.username AS creator_username
      FROM projects p
      LEFT JOIN users u ON p.creator_id = u.id
      WHERE p.id = $1
    `;
  const result = await client.query(query, [id]);
  return result.rows[0];
};

export const create = async (projectData, creatorId, client = pool) => {
  const { name, description } = projectData;
  const query = `
      INSERT INTO projects (name, description, creator_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
  const result = await client.query(query, [
    name,
    description || null,
    creatorId,
  ]);
  return result.rows[0];
};

export const update = async (id, projectData, client = pool) => {
  const { name, description } = projectData;
  const query = `
      UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
  const result = await client.query(query, [
    name || null,
    description || null,
    id,
  ]);
  return result.rows[0];
};

export const deleteById = async (id, client = pool) => {
  const result = await client.query(
    "DELETE FROM projects WHERE id=$1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

// Relations
export const addUsers = async (projectId, userIds, client = pool) => {
  for (const uid of userIds) {
    // Avoid duplicates using ON CONFLICT DO NOTHING or checks?
    // Simple insert for now, assuming external check or error handling.
    // Better safely:
    await client.query(
      "INSERT INTO projects_users (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [projectId, uid]
    );
  }
};

export const removeUser = async (projectId, userId, client = pool) => {
  await client.query(
    "DELETE FROM projects_users WHERE project_id=$1 AND user_id=$2",
    [projectId, userId]
  );
};

export const removeAllUsers = async (projectId, client = pool) => {
  await client.query("DELETE FROM projects_users WHERE project_id=$1", [
    projectId,
  ]);
};

export const getProjectUsers = async (projectId, client = pool) => {
  const query = `
      SELECT u.id, u.username, u.name, u.lastname
      FROM users u
      JOIN projects_users pu ON pu.user_id = u.id
      WHERE pu.project_id = $1
    `;
  const result = await client.query(query, [projectId]);
  return result.rows;
};

export const getProjectTasks = async (projectId, client = pool) => {
  const query = `
      SELECT t.id AS task_id, t.description, t.priority, t.completed, t.due_date,
             ts.name AS status,
             json_agg(json_build_object('id', u.id, 'username', u.username, 'name', u.name, 'lastname', u.lastname)) AS assigned_users
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      LEFT JOIN tasks_users tu ON t.id = tu.task_id
      LEFT JOIN users u ON tu.user_id = u.id
      WHERE t.project_id = $1 AND t.deleted = false
      GROUP BY t.id, ts.name
      ORDER BY t.id
    `;
  const result = await client.query(query, [projectId]);
  return result.rows;
};

// Helper
export const checkUsersExist = async (userIds, client = pool) => {
  if (!userIds || userIds.length === 0) return true;
  const res = await client.query(
    "SELECT id FROM users WHERE id = ANY($1::int[])",
    [userIds]
  );
  return res.rows.length === userIds.length;
};
