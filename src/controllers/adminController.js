import { pool } from "../db/database.js";
import bcrypt from "bcrypt";
import { catchAsync } from "../utils/catchAsync.js";
import * as AuditService from "../services/auditService.js";

export const resetDatabase = catchAsync(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Limpiar datos (orden importante por integridad referencial)
    await client.query(
      "TRUNCATE TABLE tasks_tags, tasks_users, projects_users, tasks, projects, users RESTART IDENTITY CASCADE"
    );

    // 2. Crear usuarios base
    const users = [
      {
        username: "admin",
        email: "admin@taskflow.com",
        password: "Admin123",
        name: "Admin",
        lastname: "TaskFlow",
        role: "admin",
      },
      {
        username: "manager",
        email: "manager@taskflow.com",
        password: "Manager123",
        name: "Manager",
        lastname: "TaskFlow",
        role: "manager",
      },
      {
        username: "user",
        email: "user@taskflow.com",
        password: "User123",
        name: "User",
        lastname: "TaskFlow",
        role: "user",
      },
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await client.query(
        `INSERT INTO users (username, email, password, name, lastname, role) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.username,
          user.email,
          hashedPassword,
          user.name,
          user.lastname,
          user.role,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message:
        "Base de datos reseteada correctamente. Usuarios por defecto creados.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

export const getDatabaseStats = catchAsync(async (req, res) => {
  const client = await pool.connect();
  try {
    // 1. DB Size
    const sizeRes = await client.query(
      "SELECT pg_size_pretty(pg_database_size(current_database())) as size"
    );
    const dbSize = sizeRes.rows[0].size;

    // 2. Exact Counts for Dashboard Overview
    // Using pg_stat_user_tables is faster (estimate) but for exact numbers on dashboard let's use count(*)
    // or keep pg_stat for general stats.
    // However, user specifically asked to fix slow loading.
    // Let's return the simplified stats needed for the overview here efficiently.

    // Parallelize queries
    const [usersRes, projectsRes, tasksRes, pendingRes] = await Promise.all([
      client.query("SELECT COUNT(*) FROM users"),
      client.query("SELECT COUNT(*) FROM projects"),
      client.query("SELECT COUNT(*) FROM tasks"),
      client.query(
        "SELECT COUNT(*) FROM tasks WHERE status_id != 3 AND status_id != (SELECT id FROM task_statuses WHERE name ILIKE '%complete%' LIMIT 1)"
      ), // Assuming 3 is complete, or checking dynamic
    ]);

    // For the Database View table list (keep previous logic or simplified)
    const tablesRes = await client.query(`
      SELECT relname as table_name, n_live_tup as row_count 
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC
    `);

    // Construct response
    res.status(200).json({
      success: true,
      data: {
        total_size: dbSize,
        version: (await client.query("SELECT version()")).rows[0].version,
        uptime: (
          await client.query(
            "SELECT now() - pg_postmaster_start_time() as uptime"
          )
        ).rows[0].uptime,
        active_connections: (
          await client.query("SELECT count(*) FROM pg_stat_activity")
        ).rows[0].count,
        rows: {
          users: parseInt(usersRes.rows[0].count),
          projects: parseInt(projectsRes.rows[0].count),
          tasks: parseInt(tasksRes.rows[0].count),
          pending_tasks: parseInt(pendingRes.rows[0].count),
        },
        tables: tablesRes.rows,
      },
    });
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
});

export const clearAuditLogs = catchAsync(async (req, res) => {
  await AuditService.clearLogs();
  res.status(200).json({
    success: true,
    message: "Audit logs cleared successfully",
  });
});

export const getAuditLogs = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  const logs = await AuditService.getRecentLogs(limit);

  res.status(200).json({
    success: true,
    data: logs,
  });
});
