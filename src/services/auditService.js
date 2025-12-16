// src/services/auditService.js
import { pool } from '../db/database.js';

/**
 * Log an activity to the audit_logs table.
 * @param {Object} params
 * @param {number} params.userId - User ID performing the action
 * @param {string} params.action - Action name (e.g. 'CREATE_TASK')
 * @param {string} params.entityType - Entity type (e.g. 'TASK')
 * @param {number} params.entityId - ID of the entity
 * @param {Object} [params.details] - Additional JSON details
 * @param {Object} [params.req] - Express request object to extract IP
 */
export const logAction = async ({
  userId,
  action,
  entityType,
  entityId,
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket.remoteAddress
      : null;

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId, details, ipAddress],
    );
  } catch (error) {
    console.error('FAILED TO LOG AUDIT:', error);
    // Don't throw, we don't want to break the main flow if logging fails
  }
};

/**
 * Fetch recent audit logs for admin dashboard.
 * @param {number} limit
 */
export const getRecentLogs = async (limit = 50) => {
  const query = `
    SELECT al.*, u.username, u.email, u.name, u.lastname, u.role, u.profile_image
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT $1
  `;
  const res = await pool.query(query, [limit]);
  return res.rows;
};
