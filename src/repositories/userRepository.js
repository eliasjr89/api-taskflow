// src/repositories/userRepository.js
import { pool } from '../db/database.js';

// Export pool for direct queries in controllers when needed
export { pool };

export const findAll = async (client = pool) => {
  const result = await client.query(
    'SELECT id, username, name, lastname, email, role, profile_image, created_at, updated_at FROM users ORDER BY id ASC',
  );
  return result.rows;
};

export const findByEmail = async (email, client = pool) => {
  const result = await client.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);
  return result.rows[0];
};

export const findById = async (id, client = pool) => {
  const result = await client.query(
    'SELECT id, username, name, lastname, email, role, profile_image, created_at, updated_at FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0];
};

export const findByUsername = async (username, client = pool) => {
  const result = await client.query('SELECT * FROM users WHERE username = $1', [
    username,
  ]);
  return result.rows[0];
};

export const create = async (userData, client = pool) => {
  const { username, name, lastname, email, password } = userData;
  const query = `
      INSERT INTO users (username, name, lastname, email, password, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, username, name, lastname, email, role, created_at
    `;
  const values = [username, name || null, lastname || null, email, password];
  const result = await client.query(query, values);
  return result.rows[0];
};

export const update = async (id, userData, client = pool) => {
  const { username, name, lastname, email, password, profile_image } = userData;
  const query = `
      UPDATE users SET
        username = COALESCE($1, username),
        name = COALESCE($2, name),
        lastname = COALESCE($3, lastname),
        email = COALESCE($4, email),
        password = COALESCE($5, password),
        profile_image = COALESCE($6, profile_image),
        updated_at = NOW()
      WHERE id = $7
      RETURNING id, username, name, lastname, email, role, profile_image, updated_at
    `;
  const values = [
    username || null,
    name || null,
    lastname || null,
    email || null,
    password || null,
    profile_image || null,
    id,
  ];
  const result = await client.query(query, values);
  return result.rows[0];
};

export const deleteById = async (id, client = pool) => {
  const result = await client.query(
    'DELETE FROM users WHERE id=$1 RETURNING id',
    [id],
  );
  return result.rows[0];
};
