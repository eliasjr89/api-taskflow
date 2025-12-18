// src/repositories/tagRepository.js
import { pool } from '../db/database.js';

export const findAll = async (client = pool) => {
  const result = await client.query('SELECT * FROM tags ORDER BY id ASC');
  return result.rows;
};

export const findById = async (id, client = pool) => {
  const result = await client.query('SELECT * FROM tags WHERE id=$1', [id]);
  return result.rows[0];
};

export const findByName = async (name, client = pool) => {
  const result = await client.query('SELECT * FROM tags WHERE name=$1', [name]);
  return result.rows[0];
};

export const create = async (name, color, client = pool) => {
  const result = await client.query(
    'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
    [name, color || 'blue'],
  );
  return result.rows[0];
};

export const update = async (id, name, color, client = pool) => {
  const result = await client.query(
    'UPDATE tags SET name=COALESCE($1,name), color=COALESCE($2,color), updated_at=NOW() WHERE id=$3 RETURNING *',
    [name, color, id],
  );
  return result.rows[0];
};

export const deleteById = async (id, client = pool) => {
  const result = await client.query(
    'DELETE FROM tags WHERE id=$1 RETURNING *',
    [id],
  );
  return result.rows[0];
};

export const removeTaskRelations = async (id, client = pool) => {
  await client.query('DELETE FROM tasks_tags WHERE tag_id=$1', [id]);
};
