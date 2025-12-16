// src/repositories/taskStatusRepository.js
import { pool } from '../db/database.js';

export const findAll = async (client = pool) => {
  const result = await client.query(
    'SELECT * FROM task_statuses ORDER BY id ASC',
  );
  return result.rows;
};

export const findById = async (id, client = pool) => {
  const result = await client.query('SELECT * FROM task_statuses WHERE id=$1', [
    id,
  ]);
  return result.rows[0];
};

export const findByName = async (name, client = pool) => {
  const result = await client.query(
    'SELECT * FROM task_statuses WHERE name=$1',
    [name],
  );
  return result.rows[0];
};

export const create = async (name, client = pool) => {
  const result = await client.query(
    'INSERT INTO task_statuses (name) VALUES ($1) RETURNING *',
    [name],
  );
  return result.rows[0];
};

export const update = async (id, name, client = pool) => {
  const result = await client.query(
    'UPDATE task_statuses SET name=COALESCE($1,name), updated_at=NOW() WHERE id=$2 RETURNING *',
    [name, id],
  );
  return result.rows[0];
};

export const deleteById = async (id, client = pool) => {
  const result = await client.query(
    'DELETE FROM task_statuses WHERE id=$1 RETURNING *',
    [id],
  );
  return result.rows[0];
};
