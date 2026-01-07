import { prisma } from '../lib/prisma.js';

export const getAllRoles = async () => {
  return await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: { id: 'asc' },
  });
};

export const createRole = async (data) => {
  // data: { name, description, permissionIds: [] }
  return await prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      permissions: {
        create: (data.permissionIds || []).map((permId) => ({
          permissionId: permId,
        })),
      },
    },
    include: {
      permissions: { include: { permission: true } },
    },
  });
};

export const updateRole = async (id, data) => {
  // Update basic info
  const roleUpdate = {};
  if (data.name) {
    roleUpdate.name = data.name;
  }
  if (data.description !== undefined) {
    roleUpdate.description = data.description;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update basic fields
    if (Object.keys(roleUpdate).length > 0) {
      await tx.role.update({
        where: { id: Number(id) },
        data: roleUpdate,
      });
    }

    // 2. Update permissions if provided
    if (data.permissionIds) {
      // Remove all existing
      await tx.rolePermission.deleteMany({
        where: { roleId: Number(id) },
      });

      // Add new ones
      if (data.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissionIds.map((permId) => ({
            roleId: Number(id),
            permissionId: Number(permId),
          })),
        });
      }
    }

    // Return updated role
    return await tx.role.findUnique({
      where: { id: Number(id) },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
  });
};

export const deleteRole = async (id) => {
  const role = await prisma.role.findUnique({ where: { id: Number(id) } });
  if (role && role.isSystem) {
    throw new Error('System roles cannot be deleted');
  }
  return await prisma.role.delete({
    where: { id: Number(id) },
  });
};

export const getAllPermissions = async () => {
  return await prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
  });
};

// Initializes default permissions if empty (Optional helper)
export const initPermissions = async () => {
  // Logic to seed permissions if needed, usually done in seed.js
};
