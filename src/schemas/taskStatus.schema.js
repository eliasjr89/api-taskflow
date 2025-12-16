// src/schemas/taskStatus.schema.js
import { z } from 'zod';

export const createTaskStatusSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
  }),
});

export const updateTaskStatusSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required'),
  }),
});

export const getTaskStatusSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});
