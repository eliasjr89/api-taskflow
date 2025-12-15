// src/schemas/tag.schema.js
import { z } from "zod";

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
  }),
});

export const updateTagSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    name: z.string().min(1, "Name is required"),
  }),
});

export const getTagSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});
