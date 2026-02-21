// src/services/auditService.js
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

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

    await prisma.auditLog.create({
      data: {
        userId: Number(userId),
        action,
        entityType,
        entityId: Number(entityId),
        details: details || {},
        ipAddress,
      },
    });
  } catch (error) {
    logger.error('FAILED TO LOG AUDIT:', error);
    // Don't throw, we don't want to break the main flow if logging fails
  }
};

/**
 * Fetch recent audit logs for admin dashboard.
 * @param {number} limit
 */
export const getRecentLogs = async ({
  limit = 50,
  action,
  entityType,
  userId,
}) => {
  const where = {};
  if (action) {
    where.action = { contains: action, mode: 'insensitive' };
  }
  if (entityType) {
    where.entityType = entityType;
  }
  if (userId) {
    where.userId = Number(userId);
  }

  const logs = await prisma.auditLog.findMany({
    take: Number(limit),
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          username: true,
          email: true,
          name: true,
          lastname: true,
          role: true,
          profileImage: true,
        },
      },
    },
  });

  // Flatten structure to match legacy
  return logs.map((log) => ({
    ...log,
    username: log.user?.username,
    email: log.user?.email,
    name: log.user?.name,
    lastname: log.user?.lastname,
    role: log.user?.role,
    profile_image: log.user?.profileImage,
  }));
};

/**
 * Clear all audit logs.
 */
export const clearLogs = async () => {
  await prisma.auditLog.deleteMany({});
};
