// src/db/database.js
import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

const connectionString = env.POSTGRES_URL || env.DATABASE_URL;

const poolConfig = {
  max: env.PG_MAX_CLIENTS ? parseInt(env.PG_MAX_CLIENTS) : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (connectionString) {
  poolConfig.connectionString = connectionString;
  // Cloud providers (Supabase, Neon, etc.) typically require SSL.
  // We enable it by default if using a connection string, even in dev.
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
