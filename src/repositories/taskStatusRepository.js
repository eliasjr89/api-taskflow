import { prisma } from '../lib/prisma.js';

export const findAll = async () => {
  return await prisma.taskStatus.findMany({
    orderBy: { id: 'asc' },
  });
};

export const findById = async (id) => {
  return await prisma.taskStatus.findUnique({
    where: { id: Number(id) },
  });
};

export const findByName = async (name) => {
  return await prisma.taskStatus.findUnique({
    where: { name },
  });
};

export const create = async (name) => {
  return await prisma.taskStatus.create({
    data: { name },
  });
};

export const update = async (id, name) => {
  return await prisma.taskStatus.update({
    where: { id: Number(id) },
    data: { name },
  });
};

export const deleteById = async (id) => {
  return await prisma.taskStatus.delete({
    where: { id: Number(id) },
  });
};
