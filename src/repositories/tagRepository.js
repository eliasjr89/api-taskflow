import { prisma } from '../lib/prisma.js';

export const findAll = async () => {
  return await prisma.tag.findMany({
    orderBy: { id: 'asc' },
  });
};

export const findById = async (id) => {
  return await prisma.tag.findUnique({
    where: { id: Number(id) },
  });
};

export const findByName = async (name) => {
  return await prisma.tag.findUnique({
    where: { name },
  });
};

export const create = async (name, color) => {
  return await prisma.tag.create({
    data: {
      name,
      color: color || 'blue',
    },
  });
};

export const update = async (id, name, color) => {
  const data = {};
  if (name !== undefined) {
    data.name = name;
  }
  if (color !== undefined) {
    data.color = color;
  }

  return await prisma.tag.update({
    where: { id: Number(id) },
    data,
  });
};

export const deleteById = async (id) => {
  return await prisma.tag.delete({
    where: { id: Number(id) },
  });
};

export const removeTaskRelations = async (id) => {
  // Prisma handles cascade delete defined in schema (onDelete: Cascade)
  // But strictly, this method was manually deleting from tasks_tags.
  // We can leave it empty or explicitly call deleteMany if we didn't trust cascade.
  // Since our schema has onDelete: Cascade, deleting the tag deletes the relation.
  // However, this method might be called BEFORE deleting the tag?
  // Checking usage: usually called inside delete flow.
  // For safety/legacy compatibility:
  await prisma.tasksOnTags.deleteMany({
    where: { tagId: Number(id) },
  });
};
