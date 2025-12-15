// src/db/database.js
import pg from "pg";
import { env } from "../config/env.js";

// Only disable TLS validation in local development, not in Vercel
if (env.NODE_ENV === "development" && !process.env.VERCEL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const { Pool } = pg;

// Prioritize manual override for Vercel (to use direct connection instead of pooler)
let connectionString =
  env.DATABASE_URL_OVERRIDE ||
  env.POSTGRES_PRISMA_URL ||
  env.POSTGRES_URL ||
  env.DATABASE_URL;

// CRITICAL FIX: In Vercel, automatically replace pooler port (6543) with direct port (5432)
// This avoids SSL certificate issues with Supabase pooler
if (process.env.VERCEL && connectionString) {
  if (connectionString.includes(":6543/")) {
    console.log(
      "🔧 Vercel detected: Switching from pooler (6543) to direct connection (5432)"
    );
    connectionString = connectionString.replace(":6543/", ":5432/");
    // Also remove pgbouncer parameter if present
    connectionString = connectionString
      .replace("&pgbouncer=true", "")
      .replace("?pgbouncer=true&", "?")
      .replace("?pgbouncer=true", "");
  }
}

// Debug logging for Vercel
console.log("🔍 Database connection debug:");
console.log("  - Using DATABASE_URL_OVERRIDE:", !!env.DATABASE_URL_OVERRIDE);
console.log(
  "  - Connection string port:",
  connectionString?.includes(":5432")
    ? "5432 (direct)"
    : connectionString?.includes(":6543")
    ? "6543 (pooler)"
    : "unknown"
);
console.log("  - Environment:", env.NODE_ENV);
console.log("  - Is Vercel:", !!process.env.VERCEL);

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
