// src/config/env.js
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.string().default("3000"),
    DB_HOST: z.string().optional(),
    DB_PORT: z.string().default("5432"),
    DB_USER: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_NAME: z.string().optional(),
    DATABASE_URL: z.string().optional(),
    POSTGRES_URL: z.string().optional(),
    POSTGRES_PRISMA_URL: z.string().optional(),
    PG_MAX_CLIENTS: z.string().optional(),
    JWT_SECRET: z.string().min(10, "JWT_SECRET must be at least 10 chars long"),
    JWT_EXPIRES_IN: z.string().default("1h"),
  })
  .refine(
    (data) =>
      (data.DB_HOST && data.DB_USER && data.DB_PASSWORD && data.DB_NAME) ||
      data.DATABASE_URL ||
      data.POSTGRES_URL ||
      data.POSTGRES_PRISMA_URL,
    {
      message:
        "Database configuration missing. Provide either (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) or a connection string (POSTGRES_PRISMA_URL / POSTGRES_URL / DATABASE_URL).",
      path: ["DB_HOST"], // Error pointer
    }
  );

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
