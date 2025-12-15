// src/db/database.js
import pg from "pg";
import { env } from "../config/env.js";

// Only disable TLS validation in local development, not in Vercel
if (env.NODE_ENV === "development" && !process.env.VERCEL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const { Pool } = pg;

const connectionString =
  env.POSTGRES_PRISMA_URL || env.POSTGRES_URL || env.DATABASE_URL;

const poolConfig = {
  max: env.PG_MAX_CLIENTS ? parseInt(env.PG_MAX_CLIENTS) : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (connectionString) {
  poolConfig.connectionString = connectionString;

  // SSL configuration for cloud providers (Supabase, Neon, etc.)
  // Supabase pooler uses certificates that Node.js considers self-signed
  // Setting rejectUnauthorized: false is safe here because:
  // 1. The connection is still encrypted (SSL/TLS)
  // 2. We're connecting to a known, trusted provider (Supabase)
  // 3. The connection string itself contains authentication
  poolConfig.ssl = { rejectUnauthorized: false };
} else {
  poolConfig.host = env.DB_HOST;
  poolConfig.port = env.DB_PORT;
  poolConfig.database = env.DB_NAME;
  poolConfig.user = env.DB_USER;
  poolConfig.password = env.DB_PASSWORD;
  // Only enable SSL in production for manual config or if clearly needed
  poolConfig.ssl =
    env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false;
}

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`Database connected`);
    client.release();
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};
