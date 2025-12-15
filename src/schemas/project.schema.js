// src/schemas/project.schema.js
import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    user_ids: z.array(z.number().int()).optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    user_ids: z.array(z.number().int()).optional(),
  }),
});

export const getProjectSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const addUsersToProjectSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    user_ids: z
      .array(z.number().int())
      .min(1, "At least one user_id is required"),
  }),
});

export const removeUserFromProjectSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
    userId: z.string().transform((val) => parseInt(val, 10)),
  }),
});
