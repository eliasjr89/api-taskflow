// src/db/database.js
import pg from "pg";
import { env } from "../config/env.js";

// Fix for Node.js v22+ strict SSL certificate validation
// This is safe for cloud providers like Supabase that use valid certs
// but Node.js v22 considers them self-signed
if (env.NODE_ENV === "development") {
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
  // Cloud providers (Supabase, Neon, etc.) typically require SSL.
  // Node.js v22+ has stricter SSL requirements, so we need to be more explicit
  poolConfig.ssl = {
    rejectUnauthorized: false,
    // Additional options for Node.js v22+
    checkServerIdentity: () => undefined,
  };
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
