// src/services/adminService.js
import os from 'os';
import { prisma } from '../lib/prisma.js';

export const getSystemHealth = async () => {
  const uptime = os.uptime();
  const loadAvg = os.loadavg();
  const memoryUsage = process.memoryUsage();

  // Check Datebase Connection
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  return {
    uptime,
    dbStatus,
    loadAvg, // [1, 5, 15] min
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      freeMemory: os.freemem(),
    },
    // Computed Memory Stats for Frontend Widget
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      free: os.freemem(),
      total: os.totalmem(),
      usagePercent: (
        ((os.totalmem() - os.freemem()) / os.totalmem()) *
        100
      ).toFixed(1),
    },
    timestamp: new Date(),
  };
};

export const getDashboardStats = async () => {
  const [
    usersCount,
    projectsCount,
    tasksCount,
    activeSessionsCount,
    todayLogins,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.activeSession.count(),
    prisma.activeSession.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  const tasksByStatus = await prisma.task.groupBy({
    by: ['statusId'],
    _count: {
      id: true,
    },
  });

  return {
    counts: {
      users: usersCount,
      projects: projectsCount,
      tasks: tasksCount,
      activeSessions: activeSessionsCount,
      todayLogins: todayLogins,
    },
    tasksDistribution: tasksByStatus,
  };
};
