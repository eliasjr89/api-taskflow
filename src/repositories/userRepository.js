import { prisma } from '../lib/prisma.js';

// Helper to transform Project to match legacy API response
const transformProject = (project) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  created_at: project.createdAt,
  updated_at: project.updatedAt,
  creator_username: project.creator?.username,
  num_tasks: project._count?.tasks || 0,
});

// Helper to transform Task to match legacy API response
const transformTask = (task) => ({
  id: task.id,
  description: task.description, // 'title' in frontend? Frontend maps description -> title.
  project_id: task.projectId,
  status_id: task.statusId,
  priority: task.priority,
  due_date: task.dueDate,
  completed: task.completed,
  created_at: task.createdAt,
  status: task.status?.name,
  project_name: task.project?.name,
  tags:
    task.tags && Array.isArray(task.tags)
      ? task.tags.map((t) => ({ id: t.tag.id, name: t.tag.name }))
      : [],
});

export const findAll = async () => {
  const usersWithCounts = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      username: true,
      name: true,
      lastname: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
      bio: true,
      location: true,
      website: true,
      socialLinks: true,
      _count: {
        select: { tasks: true, projects: true },
      },
    },
  });

  // Map to snake_case for backward compatibility
  return usersWithCounts.map((u) => ({
    ...u,
    social_links: u.socialLinks,
    profile_image: u.profileImage,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
    num_tasks: u._count?.tasks || 0,
    num_projects: u._count?.projects || 0,
  }));
};

export const findByEmail = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roleRel: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });
  if (!user) {
    return null;
  }

  const permissions =
    user.roleRel?.permissions.map(
      (p) => `${p.permission.action}:${p.permission.resource}`,
    ) || [];

  return {
    ...user,
    profile_image: user.profileImage,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    permissions,
  };
};

export const findById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      username: true,
      name: true,
      lastname: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
      bio: true,
      location: true,
      website: true,
      socialLinks: true,
      roleRel: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });
  if (!user) {
    return null;
  }

  // Flatten permissions for easier access
  const permissions =
    user.roleRel?.permissions.map(
      (p) => `${p.permission.action}:${p.permission.resource}`,
    ) || [];

  return {
    ...user,
    social_links: user.socialLinks,
    profile_image: user.profileImage,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    permissions, // Array of 'action:resource' strings
  };
};

export const findByUsername = async (username) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) {
    return null;
  }
  return {
    ...user,
    profile_image: user.profileImage,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
};

export const create = async (userData) => {
  const newUser = await prisma.user.create({
    data: {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      lastname: userData.lastname,
      role: userData.role || 'user',
    },
    select: {
      id: true,
      username: true,
      name: true,
      lastname: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  return { ...newUser, created_at: newUser.createdAt };
};

export const update = async (id, userData) => {
  const data = {};
  if (userData.username !== undefined) {
    data.username = userData.username;
  }
  if (userData.name !== undefined) {
    data.name = userData.name;
  }
  if (userData.lastname !== undefined) {
    data.lastname = userData.lastname;
  }
  if (userData.password !== undefined) {
    data.password = userData.password;
  }
  if (userData.role !== undefined) {
    data.role = userData.role;
  }
  if (userData.bio !== undefined) {
    data.bio = userData.bio;
  }
  if (userData.location !== undefined) {
    data.location = userData.location;
  }
  if (userData.website !== undefined) {
    data.website = userData.website;
  }
  if (userData.profile_image !== undefined) {
    data.profileImage = userData.profile_image;
  }
  if (userData.social_links !== undefined) {
    data.socialLinks = userData.social_links;
  }

  const updatedUser = await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: {
      id: true,
      username: true,
      name: true,
      lastname: true,
      email: true,
      role: true,
      createdAt: true,
      bio: true,
      location: true,
      website: true,
      socialLinks: true,
      profileImage: true,
    },
  });

  return {
    ...updatedUser,
    social_links: updatedUser.socialLinks,
    profile_image: updatedUser.profileImage,
    created_at: updatedUser.createdAt,
  };
};

export const deleteById = async (id) => {
  return await prisma.$transaction(async (tx) => {
    // Delete dependencies that don't cascade automatically (AuditLogs)
    await tx.auditLog.deleteMany({
      where: { userId: Number(id) },
    });

    // Now delete the user
    const deleted = await tx.user.delete({
      where: { id: Number(id) },
      select: { id: true },
    });
    return deleted;
  });
};

export const findProjectsByUserId = async (userId) => {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { creatorId: Number(userId) },
        { users: { some: { userId: Number(userId) } } },
      ],
    },
    include: {
      creator: { select: { username: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (projects || []).map(transformProject);
};

export const findTasksByUserId = async (userId) => {
  const tasks = await prisma.task.findMany({
    where: {
      users: { some: { userId: Number(userId) } },
      deleted: false,
    },
    include: {
      status: true,
      project: true,
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (tasks || []).map(transformTask);
};

export const assignTasks = async (userId, taskIds) => {
  if (!taskIds || taskIds.length === 0) {
    return;
  }

  await prisma.tasksOnUsers.createMany({
    data: taskIds.map((taskId) => ({
      userId: Number(userId),
      taskId: Number(taskId),
    })),
    skipDuplicates: true,
  });
};

export const syncTasks = async (userId, taskIds) => {
  // Safe check
  if (!taskIds || !Array.isArray(taskIds)) {
    return;
  }

  // Transaction to remove all and add new
  await prisma.$transaction(async (tx) => {
    // Remove all existing tasks for this user
    await tx.tasksOnUsers.deleteMany({
      where: { userId: Number(userId) },
    });

    if (taskIds.length > 0) {
      await tx.tasksOnUsers.createMany({
        data: taskIds.map((taskId) => ({
          userId: Number(userId),
          taskId: Number(taskId),
        })),
        skipDuplicates: true,
      });
    }
  });
};

export const createSession = async (data) => {
  return await prisma.activeSession.create({
    data: {
      userId: Number(data.userId),
      tokenHash: data.tokenHash || 'placeholder-' + Date.now(),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
};

export const deleteSession = async (sessionId) => {
  try {
    await prisma.activeSession.delete({
      where: { id: sessionId },
    });
  } catch {
    // Ignore if not found
  }
};

export const findSessionById = async (sessionId) => {
  return await prisma.activeSession.findUnique({
    where: { id: sessionId },
  });
};
