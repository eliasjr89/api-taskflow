// src/db/database.js
import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: env.PG_MAX_CLIENTS ? parseInt(env.PG_MAX_CLIENTS) : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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
