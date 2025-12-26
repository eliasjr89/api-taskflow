// src/repositories/userRepository.js
import { pool } from "../db/database.js";

// Export pool for direct queries in controllers when needed
export { pool };

export const findAll = async (client = pool) => {
  const result = await client.query(
    "SELECT id, username, name, lastname, email, role, profile_image, created_at, updated_at, bio, location, website FROM users ORDER BY id ASC"
  );
  return result.rows;
};

export const findByEmail = async (email, client = pool) => {
  const query =
    "SELECT id, username, name, lastname, email, password, role, profile_image, created_at, bio, location, website FROM users WHERE email = $1";
  const result = await client.query(query, [email]);
  return result.rows[0];
};

export const findById = async (id, client = pool) => {
  const query =
    "SELECT id, username, name, lastname, email, role, profile_image, created_at, bio, location, website FROM users WHERE id = $1";
  const result = await client.query(query, [id]);
  return result.rows[0];
};

export const findByUsername = async (username, client = pool) => {
  const query =
    "SELECT id, username, name, lastname, email, password, role, profile_image, created_at, bio, location, website FROM users WHERE username = $1";
  const result = await client.query(query, [username]);
  return result.rows[0];
};

export const create = async (userData, client = pool) => {
  const { username, name, lastname, email, password, role } = userData;
  const query = `
      INSERT INTO users (username, name, lastname, email, password, role, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, username, name, lastname, email, role, created_at
    `;
  const values = [
    username,
    name || null,
    lastname || null,
    email,
    password,
    role || "user",
  ];
  const result = await client.query(query, values);
  return result.rows[0];
};

export const update = async (id, userData, client = pool) => {
  const { username, name, lastname, password, role, bio, location, website } =
    userData;
  const query = `
      UPDATE users SET
        username = COALESCE($1, username),
        name = COALESCE($2, name),
        lastname = COALESCE($3, lastname),
        password = COALESCE($4, password),
        role = COALESCE($5, role),
        bio = COALESCE($6, bio),
        location = COALESCE($7, location),
        website = COALESCE($8, website),
        profile_image = COALESCE($9, profile_image),
        updated_at = NOW()
      WHERE id = $10
      RETURNING id, username, name, lastname, email, role, created_at, bio, location, website, profile_image
    `;
  const values = [
    username || null,
    name || null,
    lastname || null,
    password || null,
    role || null,
    bio || null,
    location || null,
    website || null,
    userData.profile_image || null,
    id,
  ];
  const result = await client.query(query, values);
  return result.rows[0];
};

export const deleteById = async (id, client = pool) => {
  const result = await client.query(
    "DELETE FROM users WHERE id=$1 RETURNING id",
    [id]
  );
  return result.rows[0];
};

export const findProjectsByUserId = async (userId, client = pool) => {
  const query = `
    SELECT DISTINCT p.id, p.name, p.description, p.created_at, p.updated_at,
           u.username AS creator_username,
           COUNT(DISTINCT t.id) AS num_tasks
    FROM projects p
    LEFT JOIN users u ON p.creator_id = u.id
    LEFT JOIN projects_users pu ON p.id = pu.project_id
    LEFT JOIN tasks t ON p.id = t.project_id AND t.deleted = false
    WHERE p.creator_id = $1 OR pu.user_id = $1
    GROUP BY p.id, u.username
    ORDER BY p.created_at DESC
  `;
  const result = await client.query(query, [userId]);
  return result.rows;
};

export const findTasksByUserId = async (userId, client = pool) => {
  const query = `
    SELECT t.*, ts.name AS status,
           p.name AS project_name,
           json_agg(DISTINCT jsonb_build_object('id', tag.id, 'name', tag.name)) FILTER (WHERE tag.id IS NOT NULL) AS tags
    FROM tasks t
    LEFT JOIN task_statuses ts ON t.status_id = ts.id
    LEFT JOIN projects p ON t.project_id = p.id
    INNER JOIN tasks_users tu ON t.id = tu.task_id
    LEFT JOIN tasks_tags tt ON t.id = tt.task_id
    LEFT JOIN tags tag ON tt.tag_id = tag.id
    WHERE tu.user_id = $1 AND t.deleted = false
    GROUP BY t.id, ts.name, p.name
    ORDER BY t.created_at DESC
  `;
  const result = await client.query(query, [userId]);
  return result.rows;
};
