// src/controllers/announcementController.js
import * as AnnouncementService from '../services/announcementService.js';
import { catchAsync } from '../utils/catchAsync.js';

export const createAnnouncement = catchAsync(async (req, res) => {
  const announcement = await AnnouncementService.createAnnouncement(
    req.body,
    req.user.id,
  );
  res.status(201).json({
    success: true,
    data: announcement,
    message: 'Announcement created and broadcasted',
  });
});

export const getActiveAnnouncements = catchAsync(async (req, res) => {
  const announcements = await AnnouncementService.getActiveAnnouncements();
  res.status(200).json({
    success: true,
    data: announcements,
  });
});

export const getAllAnnouncements = catchAsync(async (req, res) => {
  const announcements = await AnnouncementService.getAllAnnouncements();
  res.status(200).json({
    success: true,
    data: announcements,
  });
});

export const deactivateAnnouncement = catchAsync(async (req, res) => {
  await AnnouncementService.deactivateAnnouncement(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Announcement deactivated',
  });
});
