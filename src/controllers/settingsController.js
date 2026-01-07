import { prisma } from '../lib/prisma.js';
import { catchAsync } from '../utils/catchAsync.js';
import { clearMaintenanceCache } from '../middleware/maintenance.middleware.js';

// GET /admin/settings
export const getSettings = catchAsync(async (req, res) => {
  const settings = await prisma.systemSetting.findMany();
  // Transform to object { key: value }
  const settingsMap = settings.reduce((acc, curr) => {
    try {
      acc[curr.key] = JSON.parse(curr.value);
    } catch {
      acc[curr.key] = curr.value;
    }
    return acc;
  }, {});

  res.status(200).json({ success: true, data: settingsMap });
});

// PUT /admin/settings/:key
export const updateSetting = catchAsync(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(value) },
    create: { key, value: JSON.stringify(value) },
  });

  // Clear maintenance cache when MAINTENANCE_MODE is updated
  if (key === 'MAINTENANCE_MODE') {
    clearMaintenanceCache();
  }

  res.status(200).json({
    success: true,
    data: { [setting.key]: JSON.parse(setting.value) },
  });
});
