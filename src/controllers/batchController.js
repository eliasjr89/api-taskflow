// src/controllers/batchController.js
import * as BatchService from '../services/batchService.js';
import { catchAsync } from '../utils/catchAsync.js';

export const archiveOldTasks = catchAsync(async (req, res) => {
  const { days = 30 } = req.body;
  const count = await BatchService.archiveOldTasks(Number(days));

  res.status(200).json({
    success: true,
    message: `Archived ${count} completed tasks older than ${days} days`,
    data: { count },
  });
});
