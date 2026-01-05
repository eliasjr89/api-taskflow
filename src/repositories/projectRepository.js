import { prisma } from '../lib/prisma.js';

// Helper to transform Project to match legacy API response
const transformProject = (project) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  color: 'indigo', // Default as schema doesn't have it yet, or add to schema if critical
  icon: 'Folder', // Default
  created_at: project.createdAt,
  updated_at: project.updatedAt,
  creator_id: project.creatorId,
  creator_username: project.creator?.username,
  creator_name: project.creator?.name,
  creator_lastname: project.creator?.lastname,
  creator_role: project.creator?.role,
  num_tasks: project._count?.tasks || 0,
  num_team_members: project._count?.users || 0,
  users:
    project.users?.map((u) => ({
      id: u.user.id,
      username: u.user.username,
      profile_image: u.user.profileImage,
    })) || [],
});

export const findAll = async () => {
  const projects = await prisma.project.findMany({
    include: {
      creator: true,
      users: {
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            },
          },
        },
      },
      _count: {
        select: { tasks: true, users: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return projects.map(transformProject);
};

export const findById = async (id, tx = prisma) => {
  const project = await tx.project.findUnique({
    where: { id: Number(id) },
    include: {
      creator: true,
      _count: {
        select: { tasks: true, users: true },
      },
    },
  });
  if (!project) {
    return null;
  }

  // For findById, legacy might expect simplified object, but let's conform to standard
  return {
    ...transformProject(project),
    // Additional fields if needed
  };
};

export const create = async (projectData, creatorId, tx = prisma) => {
  const { name, description } = projectData;
  const project = await tx.project.create({
    data: {
      name,
      description,
      creatorId: Number(creatorId),
      // color/icon ignored as per current schema, add if needed
    },
  });
  return transformProject(project);
};

export const update = async (id, projectData, tx = prisma) => {
  const { name, description } = projectData;
  const data = {};
  if (name !== undefined) {
    data.name = name;
  }
  if (description !== undefined) {
    data.description = description;
  }

  const project = await tx.project.update({
    where: { id: Number(id) },
    data,
  });
  return transformProject(project);
};

export const deleteById = async (id, tx = prisma) => {
  const project = await tx.project.delete({
    where: { id: Number(id) },
  });
  return transformProject(project);
};

// Relations
export const addUsers = async (projectId, userIds, tx = prisma) => {
  // Prisma doesn't support ON CONFLICT DO NOTHING for createMany easily without throwing
  // But we can just try/catch or use createMany with skipDuplicates (if DB supports it, Postgres does)
  await tx.projectsOnUsers.createMany({
    data: userIds.map((userId) => ({
      projectId: Number(projectId),
      userId: Number(userId),
    })),
    skipDuplicates: true,
  });
};

export const removeUser = async (projectId, userId, tx = prisma) => {
  try {
    await tx.projectsOnUsers.delete({
      where: {
        projectId_userId: {
          projectId: Number(projectId),
          userId: Number(userId),
        },
      },
    });
  } catch (error) {
    // Ignore if not found
    if (error.code !== 'P2025') {
      throw error;
    }
  }
};

export const removeAllUsers = async (projectId, tx = prisma) => {
  await tx.projectsOnUsers.deleteMany({
    where: { projectId: Number(projectId) },
  });
};

export const getProjectUsers = async (projectId, tx = prisma) => {
  const relations = await tx.projectsOnUsers.findMany({
    where: { projectId: Number(projectId) },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          lastname: true,
        },
      },
    },
  });
  return relations.map((r) => r.user);
};

export const getProjectTasks = async (projectId, tx = prisma) => {
  const tasks = await tx.task.findMany({
    where: {
      projectId: Number(projectId),
      deleted: false,
    },
    include: {
      status: true,
      users: {
        include: {
          user: {
            select: { id: true, username: true, name: true, lastname: true },
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  return tasks.map((t) => ({
    task_id: t.id,
    description: t.description,
    priority: t.priority,
    completed: t.completed,
    due_date: t.dueDate,
    status: t.status?.name,
    assigned_users: t.users.map((u) => u.user),
  }));
};

export const checkUsersExist = async (userIds, tx = prisma) => {
  if (!userIds || userIds.length === 0) {
    return true;
  }
  const count = await tx.user.count({
    where: {
      id: { in: userIds.map(Number) },
    },
  });
  return count === userIds.length;
};
