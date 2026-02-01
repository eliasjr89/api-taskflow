// src/db/database.js
import pg from 'pg';
import { env } from '../config/env.js';

// Only disable TLS validation in local development, not in Vercel
if (env.NODE_ENV === 'development' && !process.env.VERCEL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const { Pool } = pg;

// Prioritize manual override for Vercel (to use direct connection instead of pooler)
let connectionString =
  env.DATABASE_URL_OVERRIDE ||
  env.POSTGRES_URL_NON_POOLING ||
  env.POSTGRES_PRISMA_URL ||
  env.POSTGRES_URL ||
  env.DATABASE_URL;

// CRITICAL FIX: In Vercel, automatically replace pooler port (6543) with direct port (5432)
// This avoids SSL certificate issues with Supabase pooler
// CRITICAL FIX: In Vercel, automatically replace pooler port (6543) with direct port (5432)
// This avoids SSL certificate issues with Supabase pooler
if (process.env.VERCEL && connectionString) {
  if (connectionString.includes(':6543/')) {
    console.log(
      '🔧 Vercel detected: Switching from pooler (6543) to direct connection (5432)',
    );
    connectionString = connectionString.replace(':6543/', ':5432/');
    // Also remove pgbouncer parameter if present
    connectionString = connectionString
      .replace('&pgbouncer=true', '')
      .replace('?pgbouncer=true&', '?')
      .replace('?pgbouncer=true', '');
  }

  // CRITICAL: Remove sslmode parameter - it overrides our custom SSL config
  connectionString = connectionString.replace(/[?&]sslmode=\w+/g, '');
  console.log('🔧 Removed sslmode parameter to use custom SSL config');
}

const poolConfig = {
  max: env.PG_MAX_CLIENTS ? parseInt(env.PG_MAX_CLIENTS) : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (connectionString) {
  poolConfig.connectionString = connectionString;

  // SSL configuration for cloud providers (Supabase, Neon, etc.)
  if (env.NODE_ENV === 'development' && !process.env.VERCEL) {
    poolConfig.ssl = false;
    console.log('🔒 SSL Disabled for local development');
  } else {
    // Supabase uses certificates that Node.js v22+ considers self-signed
    poolConfig.ssl = {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
      secureOptions: 0, // Disable all SSL verification
    };
    console.log('🔒 SSL Config applied:', { rejectUnauthorized: false });
  }
} else {
  poolConfig.host = env.DB_HOST;
  poolConfig.port = env.DB_PORT;
  poolConfig.database = env.DB_NAME;
  poolConfig.user = env.DB_USER;
  poolConfig.password = env.DB_PASSWORD;
  // Only enable SSL in production for manual config or if clearly needed
  poolConfig.ssl =
    env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
}

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected');
    client.release();
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};
