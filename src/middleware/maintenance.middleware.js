// src/middleware/maintenance.middleware.js
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

// Cache for maintenance mode setting
let maintenanceCache = {
  value: false,
  timestamp: 0,
  ttl: 30000, // 30 seconds
};

/**
 * Middleware to check if maintenance mode is active
 * Blocks non-admin users when maintenance mode is enabled
 */
export const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Check cache first
    const now = Date.now();
    if (now - maintenanceCache.timestamp < maintenanceCache.ttl) {
      if (
        maintenanceCache.value &&
        req.user?.role !== 'admin' &&
        req.user?.role !== 'manager'
      ) {
        return res.status(503).json({
          success: false,
          message:
            'System is currently under maintenance. Please try again later.',
          maintenanceMode: true,
        });
      }
      return next();
    }

    // Fetch from database
    const setting = await prisma.setting.findUnique({
      where: { key: 'MAINTENANCE_MODE' },
    });

    const isMaintenanceMode =
      setting?.value === 'true' || setting?.value === true;

    // Update cache
    maintenanceCache = {
      value: isMaintenanceMode,
      timestamp: now,
      ttl: 30000,
    };

    // Block non-admin users if maintenance mode is active
    if (
      isMaintenanceMode &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'manager'
    ) {
      return res.status(503).json({
        success: false,
        message:
          'System is currently under maintenance. Please try again later.',
        maintenanceMode: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Maintenance middleware error:', error);
    // On error, allow request to proceed (fail open)
    next();
  }
};

/**
 * Clear the maintenance mode cache
 * Call this when maintenance mode is toggled
 */
export const clearMaintenanceCache = () => {
  maintenanceCache.timestamp = 0;
};
