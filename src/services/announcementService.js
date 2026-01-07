// src/services/announcementService.js
import { prisma } from '../lib/prisma.js';
import { getIO } from '../lib/socket.js';

export const createAnnouncement = async (data, creatorId) => {
  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      message: data.message,
      type: data.type || 'info', // info, warning, success, error
      startsAt: data.startsAt || new Date(),
      endsAt: data.endsAt,
      createdBy: creatorId,
      isActive: true,
    },
  });

  // Broadcast via Socket.io
  try {
    const io = getIO();
    io.emit('announcement:new', announcement);
  } catch {
    console.error('Socket not initialized, skipping broadcast');
  }

  return announcement;
};

export const getActiveAnnouncements = async () => {
  const now = new Date();
  return await prisma.announcement.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    orderBy: { startsAt: 'desc' },
  });
};

export const getAllAnnouncements = async () => {
  return await prisma.announcement.findMany({
    include: {
      creator: {
        select: { username: true, name: true, lastname: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const deactivateAnnouncement = async (id) => {
  const updated = await prisma.announcement.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });

  // Optional: Notify removal?
  // getIO().emit('announcement:removed', id);
  return updated;
};
