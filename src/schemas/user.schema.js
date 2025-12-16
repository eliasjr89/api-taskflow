// src/schemas/user.schema.js
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    name: z.string().optional(),
    lastname: z.string().optional(),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    username: z.string().min(1).optional(),
    name: z.string().optional(),
    lastname: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});
