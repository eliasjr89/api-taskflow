// src/repositories/taskRepository.js
import { pool } from '../db/database.js';

export const findAll = async (
  { user_id, project_id, status_id, priority, tag_id, limit, offset },
  client = pool,
) => {
  const filters = ['t.deleted = false'];
  const values = [];
  let idx = 1;

  if (user_id) {
    filters.push(
      `t.id IN (SELECT task_id FROM tasks_users WHERE user_id=$${idx++})`,
    );
    values.push(user_id);
  }
  if (project_id) {
    filters.push(`t.project_id=$${idx++}`);
    values.push(project_id);
  }
  if (status_id) {
    filters.push(`t.status_id=$${idx++}`);
    values.push(status_id);
  }
  if (priority) {
    filters.push(`t.priority=$${idx++}`);
    values.push(priority);
  }
  if (tag_id) {
    filters.push(
      `t.id IN (SELECT task_id FROM tasks_tags WHERE tag_id=$${idx++})`,
    );
    values.push(tag_id);
  }

  const whereClause = `WHERE ${filters.join(' AND ')}`;

  // Pagination params
  values.push(limit);
  values.push(offset);
  const limitOffsetClause = `LIMIT $${idx++} OFFSET $${idx++}`;

  const query = `
      SELECT t.*, ts.name AS status, p.name AS project_name,
             json_agg(DISTINCT jsonb_build_object('id', u.id, 'username', u.username, 'name', u.name, 'lastname', u.lastname)) FILTER (WHERE u.id IS NOT NULL) AS users,
             json_agg(DISTINCT jsonb_build_object('id', tag.id, 'name', tag.name)) FILTER (WHERE tag.id IS NOT NULL) AS tags
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN tasks_users tu ON t.id = tu.task_id
      LEFT JOIN users u ON tu.user_id = u.id
      LEFT JOIN tasks_tags tt ON t.id = tt.task_id
      LEFT JOIN tags tag ON tt.tag_id = tag.id
      ${whereClause}
      GROUP BY t.id, ts.name, p.name
      ORDER BY t.created_at DESC
      ${limitOffsetClause}
    `;

  const countQuery = `
    SELECT COUNT(DISTINCT t.id) 
    FROM tasks t
    LEFT JOIN tasks_users tu ON t.id = tu.task_id
    LEFT JOIN tasks_tags tt ON t.id = tt.task_id
    ${whereClause}
  `;

  const countValues = values.slice(0, -2); // remove limit and offset
  const countRes = await client.query(countQuery, countValues);

  const result = await client.query(query, values);

  return {
    tasks: result.rows,
    total: parseInt(countRes.rows[0].count, 10),
  };
};

export const deleteById = async (id, client = pool) => {
  // Hard delete dependencies first
  await client.query('DELETE FROM tasks_users WHERE task_id=$1', [id]);
  await client.query('DELETE FROM tasks_tags WHERE task_id=$1', [id]);
  const res = await client.query('DELETE FROM tasks WHERE id=$1 RETURNING *', [
    id,
  ]);
  return res.rows[0];
};

export const findById = async (id, client = pool) => {
  const taskQuery = `
      SELECT t.*, ts.name AS status
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE t.id = $1 AND t.deleted = false
    `;
  const taskResult = await client.query(taskQuery, [id]);
  if (!taskResult.rows.length) {
    return null;
  }

  const task = taskResult.rows[0];

  const usersQuery = `
      SELECT u.id, u.username, u.name, u.lastname
      FROM users u
      JOIN tasks_users tu ON tu.user_id = u.id
      WHERE tu.task_id = $1
    `;
  const usersResult = await client.query(usersQuery, [id]);
  task.users = usersResult.rows;

  const tagsQuery = `
      SELECT tag.id, tag.name
      FROM tags tag
      JOIN tasks_tags tt ON tt.tag_id = tag.id
      WHERE tt.task_id = $1
    `;
  const tagsResult = await client.query(tagsQuery, [id]);
  task.tags = tagsResult.rows;

  return task;
};

export const create = async (taskData, client = pool) => {
  const { description, project_id, status_id, priority, completed, due_date } =
    taskData;

  const insertTask = `
      INSERT INTO tasks (description, project_id, status_id, priority, completed, due_date, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
    `;
  const res = await client.query(insertTask, [
    description,
    project_id,
    status_id,
    priority || 'low',
    completed || false,
    due_date || null,
  ]);
  return res.rows[0];
};

export const update = async (id, taskData, client = pool) => {
  const { description, status_id, priority, completed, due_date } = taskData;
  const updateQuery = `
      UPDATE tasks SET
        description = COALESCE($1, description),
        status_id = COALESCE($2, status_id),
        priority = COALESCE($3, priority),
        completed = COALESCE($4, completed),
        due_date = COALESCE($5, due_date),
        updated_at = NOW()
      WHERE id=$6
      RETURNING *
    `;
  const res = await client.query(updateQuery, [
    description || null,
    status_id || null,
    priority || null,
    completed,
    due_date || null,
    id,
  ]);
  return res.rows[0];
};

export const deleteSoft = async (id, client = pool) => {
  const res = await client.query(
    'UPDATE tasks SET deleted=true, updated_at=NOW() WHERE id=$1 RETURNING *',
    [id],
  );
  return res.rows[0];
};

export const addUsers = async (taskId, userIds, client = pool) => {
  for (const uid of userIds) {
    await client.query(
      'INSERT INTO tasks_users (task_id, user_id) VALUES ($1,$2)',
      [taskId, uid],
    );
  }
};

export const removeUser = async (taskId, userId, client = pool) => {
  await client.query(
    'DELETE FROM tasks_users WHERE task_id=$1 AND user_id=$2',
    [taskId, userId],
  );
};

export const removeAllUsers = async (taskId, client = pool) => {
  await client.query('DELETE FROM tasks_users WHERE task_id=$1', [taskId]);
};

export const addTags = async (taskId, tagIds, client = pool) => {
  for (const tid of tagIds) {
    await client.query(
      'INSERT INTO tasks_tags (task_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [taskId, tid],
    );
  }
};

export const removeTag = async (taskId, tagId, client = pool) => {
  await client.query('DELETE FROM tasks_tags WHERE task_id=$1 AND tag_id=$2', [
    taskId,
    tagId,
  ]);
};

export const removeAllTags = async (taskId, client = pool) => {
  await client.query('DELETE FROM tasks_tags WHERE task_id=$1', [taskId]);
};

// Helper checks
export const checkProjectExists = async (id, client = pool) => {
  const res = await client.query('SELECT id FROM projects WHERE id=$1', [id]);
  return res.rows.length > 0;
};

export const checkStatusExists = async (id, client = pool) => {
  const res = await client.query('SELECT id FROM task_statuses WHERE id=$1', [
    id,
  ]);
  return res.rows.length > 0;
};

export const checkUsersExist = async (userIds, client = pool) => {
  if (!userIds || userIds.length === 0) {
    return true;
  }
  const res = await client.query(
    'SELECT id FROM users WHERE id = ANY($1::int[])',
    [userIds],
  );
  return res.rows.length === userIds.length;
};

export const checkTagsExist = async (tagIds, client = pool) => {
  if (!tagIds || tagIds.length === 0) {
    return true;
  }
  const res = await client.query(
    'SELECT id FROM tags WHERE id = ANY($1::int[])',
    [tagIds],
  );
  return res.rows.length === tagIds.length;
};

export const getTaskUsers = async (taskId, client = pool) => {
  const query = `
    SELECT u.id, u.username, u.name, u.lastname, u.email
    FROM users u
    JOIN tasks_users tu ON tu.user_id = u.id
    WHERE tu.task_id = $1
  `;
  const result = await client.query(query, [taskId]);
  return result.rows;
};

export const getTaskTags = async (taskId, client = pool) => {
  const query = `
    SELECT tag.id, tag.name
    FROM tags tag
    JOIN tasks_tags tt ON tt.tag_id = tag.id
    WHERE tt.task_id = $1
  `;
  const result = await client.query(query, [taskId]);
  return result.rows;
};
