// src/services/batchService.js
import { prisma } from '../lib/prisma.js';

export const archiveOldTasks = async (days) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await prisma.task.updateMany({
    where: {
      updatedAt: {
        lt: cutoffDate,
      },
      status: {
        name: 'completed', // Only archive completed tasks? Or all? Usually completed.
      },
    },
    data: {
      deleted: true, // Soft delete/archive
    },
  });

  return result.count;
};

export const deleteInactiveUsers = async (days) => {
  // Be careful with this!
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Find users who haven't logged in (no active sessions recently? Or check last login field if exists?)
  // We added lastActiveAt to ActiveSession. But if session deleted, we lose track.
  // We should probably rely on 'updatedAt' of user or specific 'lastLoginAt'.
  // We don't have 'lastLoginAt' on User. ActiveSession tracks current.
  // If we assume lack of ActiveSession means inactive? No.
  // We'll skip this destructive action for now or base it on 'updatedAt' if simplistic.
  // Safe approach: Archive tasks first.

  // Implementation for now: Return 0 to be safe until 'lastLoginAt' schema exists.
  return 0;
};
