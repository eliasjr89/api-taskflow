import { prisma } from '../lib/prisma.js';

// Helper to match legacy response format
const transformTask = (task) => ({
  id: task.id,
  description: task.description,
  project_id: task.projectId,
  status_id: task.statusId,
  priority: task.priority,
  due_date: task.dueDate,
  completed: task.completed,
  created_at: task.createdAt,
  updated_at: task.updatedAt,
  project_name: task.project?.name,
  project_color: task.project?.color,
  project_icon: task.project?.icon,
  status: task.status?.name,
  users: task.users?.map((u) => u.user) || [],
  tags: task.tags?.map((t) => t.tag) || [],
});

export const findAll = async ({
  user_id,
  project_id,
  status_id,
  priority,
  tag_id,
  limit,
  offset,
}) => {
  const where = {
    deleted: false,
  };

  if (user_id) {
    where.users = {
      some: {
        userId: Number(user_id),
      },
    };
  }
  if (project_id) {
    where.projectId = Number(project_id);
  }
  if (status_id) {
    where.statusId = Number(status_id);
  }
  if (priority) {
    where.priority = priority;
  }
  if (tag_id) {
    where.tags = {
      some: {
        tagId: Number(tag_id),
      },
    };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { name: true, color: true, icon: true } },
      status: { select: { name: true } },
      users: {
        include: {
          user: {
            select: { id: true, username: true, name: true, lastname: true },
          },
        },
      },
      tags: {
        include: {
          tag: { select: { id: true, name: true, color: true } },
        },
      },
    },
    orderBy: { id: 'asc' },
    skip: offset ? Number(offset) : undefined,
    take: limit ? Number(limit) : undefined,
  });

  const total = await prisma.task.count({ where });

  return {
    tasks: tasks.map(transformTask),
    total,
  };
};

export const deleteById = async (id, tx = prisma) => {
  const task = await tx.task.delete({
    where: { id: Number(id) },
  });
  return transformTask(task);
};

export const findById = async (id, tx = prisma) => {
  const task = await tx.task.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      project: { select: { name: true, color: true, icon: true } },
      status: true,
      users: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              lastname: true,
              email: true,
            },
          },
        },
      },
      tags: {
        include: { tag: { select: { id: true, name: true, color: true } } },
      },
    },
  });

  if (!task || task.deleted) {
    return null;
  }

  return transformTask(task);
};

export const create = async (taskData, tx = prisma) => {
  const { description, project_id, status_id, priority, completed, due_date } =
    taskData;

  const task = await tx.task.create({
    data: {
      description,
      projectId: Number(project_id),
      statusId: Number(status_id),
      priority: priority || 'low',
      completed: completed || false,
      dueDate: due_date || null,
    },
  });

  return transformTask(task);
};

export const update = async (id, taskData, tx = prisma) => {
  const { description, status_id, priority, completed, due_date } = taskData;
  const data = {};
  if (description !== undefined) {
    data.description = description;
  }
  if (status_id !== undefined) {
    data.statusId = Number(status_id);
  }
  if (priority !== undefined) {
    data.priority = priority;
  }
  if (completed !== undefined) {
    data.completed = completed;
  }
  if (due_date !== undefined) {
    data.dueDate = due_date;
  }

  const task = await tx.task.update({
    where: { id: Number(id) },
    data,
  });

  return transformTask(task);
};

export const deleteSoft = async (id, tx = prisma) => {
  const task = await tx.task.update({
    where: { id: Number(id) },
    data: { deleted: true },
  });
  return transformTask(task);
};

export const addUsers = async (taskId, userIds, tx = prisma) => {
  await tx.tasksOnUsers.createMany({
    data: userIds.map((uid) => ({
      taskId: Number(taskId),
      userId: Number(uid),
    })),
    skipDuplicates: true,
  });
};

export const removeUser = async (taskId, userId, tx = prisma) => {
  try {
    await tx.tasksOnUsers.delete({
      where: {
        taskId_userId: {
          taskId: Number(taskId),
          userId: Number(userId),
        },
      },
    });
  } catch (error) {
    if (error.code !== 'P2025') {
      throw error;
    }
  }
};

export const removeAllUsers = async (taskId, tx = prisma) => {
  await tx.tasksOnUsers.deleteMany({
    where: { taskId: Number(taskId) },
  });
};

export const addTags = async (taskId, tagIds, tx = prisma) => {
  await tx.tasksOnTags.createMany({
    data: tagIds.map((tid) => ({
      taskId: Number(taskId),
      tagId: Number(tid),
    })),
    skipDuplicates: true,
  });
};

export const removeTag = async (taskId, tagId, tx = prisma) => {
  try {
    await tx.tasksOnTags.delete({
      where: {
        taskId_tagId: {
          taskId: Number(taskId),
          tagId: Number(tagId),
        },
      },
    });
  } catch (error) {
    if (error.code !== 'P2025') {
      throw error;
    }
  }
};

export const removeAllTags = async (taskId, tx = prisma) => {
  await tx.tasksOnTags.deleteMany({
    where: { taskId: Number(taskId) },
  });
};

// Helper checks
export const checkProjectExists = async (id, tx = prisma) => {
  const count = await tx.project.count({ where: { id: Number(id) } });
  return count > 0;
};

export const checkStatusExists = async (id, tx = prisma) => {
  const count = await tx.taskStatus.count({ where: { id: Number(id) } });
  return count > 0;
};

export const checkUsersExist = async (userIds, tx = prisma) => {
  if (!userIds || userIds.length === 0) {
    return true;
  }
  const count = await tx.user.count({
    where: { id: { in: userIds.map(Number) } },
  });
  return count === userIds.length;
};

export const checkTagsExist = async (tagIds, tx = prisma) => {
  if (!tagIds || tagIds.length === 0) {
    return true;
  }
  const count = await tx.tag.count({
    where: { id: { in: tagIds.map(Number) } },
  });
  return count === tagIds.length;
};

export const getTaskUsers = async (taskId, tx = prisma) => {
  const relations = await tx.tasksOnUsers.findMany({
    where: { taskId: Number(taskId) },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          lastname: true,
          email: true,
        },
      },
    },
  });
  return relations.map((r) => r.user);
};

export const getTaskTags = async (taskId, tx = prisma) => {
  const relations = await tx.tasksOnTags.findMany({
    where: { taskId: Number(taskId) },
    include: {
      tag: {
        select: { id: true, name: true },
      },
    },
  });
  return relations.map((r) => r.tag);
};
