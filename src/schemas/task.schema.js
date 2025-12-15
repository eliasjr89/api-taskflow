// src/schemas/task.schema.js
import { z } from "zod";

export const createTaskSchema = z.object({
  body: z.object({
    description: z.string().min(1, "Description is required"),
    project_id: z
      .number()
      .int()
      .positive("Project ID must be a positive integer"),
    status_id: z
      .number()
      .int()
      .positive("Status ID must be a positive integer"),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    completed: z.boolean().optional(),
    due_date: z.string().datetime().optional().nullable(),
    user_ids: z.array(z.number().int()).optional(),
    tag_ids: z.array(z.number().int()).optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    description: z.string().min(1).optional(),
    project_id: z.number().int().positive().optional(),
    status_id: z.number().int().positive().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    completed: z.boolean().optional(),
    due_date: z.string().datetime().optional().nullable(),
    user_ids: z.array(z.number().int()).optional(),
    tag_ids: z.array(z.number().int()).optional(),
  }),
});

export const getTaskSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const getTasksQuerySchema = z.object({
  query: z.object({
    user_id: z
      .string()
      .transform((val) => parseInt(val, 10))
      .optional(),
    project_id: z
      .string()
      .transform((val) => parseInt(val, 10))
      .optional(),
    status_id: z
      .string()
      .transform((val) => parseInt(val, 10))
      .optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    tag_id: z
      .string()
      .transform((val) => parseInt(val, 10))
      .optional(),
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .optional()
      .default("1"),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .optional()
      .default("10"),
  }),
});

export const addUsersToTaskSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    user_ids: z.array(z.number().int()).min(1),
  }),
});

export const removeUserFromTaskSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
    userId: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const addTagsToTaskSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    tag_ids: z.array(z.number().int()).min(1),
  }),
});

export const removeTagFromTaskSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
    tagId: z.string().transform((val) => parseInt(val, 10)),
  }),
});
