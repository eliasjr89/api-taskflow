import 'dotenv/config';
import app from '../src/app.js';
import { connectDB } from '../src/db/database.js';

// Initialize database connection for serverless environment
let isDbConnected = false;
let initError = null;

const initializeDB = async () => {
  if (initError) {
    throw initError;
  }

  if (!isDbConnected) {
    try {
      // Only load .env file in local development (not in Vercel)
      if (!process.env.VERCEL) {
        dotenv.config();
      }

      // CRITICAL: Normalize environment variables for Prisma and pooler
      if (process.env.VERCEL) {
        if (!process.env.DATABASE_URL) {
          process.env.DATABASE_URL =
            process.env.DATABASE_URL_OVERRIDE ||
            process.env.POSTGRES_URL_NON_POOLING ||
            process.env.POSTGRES_PRISMA_URL ||
            process.env.POSTGRES_URL;
          if (process.env.DATABASE_URL) {
            console.log('✅ DATABASE_URL normalized from fallback variables');
          }
        }
        if (!process.env.DIRECT_URL) {
          process.env.DIRECT_URL =
            process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
        }
      }
      // Validate required environment variables
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
      }

      if (
        !process.env.DATABASE_URL_OVERRIDE &&
        !process.env.POSTGRES_URL_NON_POOLING &&
        !process.env.POSTGRES_PRISMA_URL &&
        !process.env.POSTGRES_URL &&
        !process.env.DATABASE_URL
      ) {
        throw new Error(
          'Database connection string not found in environment variables',
        );
      }

      await connectDB();
      isDbConnected = true;
      console.log('✅ Database initialized for serverless function');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      initError = error;
      throw error;
    }
  }
};

// Vercel serverless function handler
export default async (req, res) => {
  try {
    // Optimization: Skip DB connection for Options requests (CORS preflight)
    // This makes preflight checks much faster and cleaner
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Ensure DB is connected before handling requests
    await initializeDB();

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);

    // Return detailed error in development, generic in production
    const isDev = process.env.NODE_ENV === 'development';

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: isDev ? error.message : 'A server error has occurred',
      details: isDev
        ? {
          stack: error.stack,
          env: {
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasDbUrl: !!(
              process.env.POSTGRES_PRISMA_URL ||
                process.env.POSTGRES_URL ||
                process.env.DATABASE_URL
            ),
            nodeEnv: process.env.NODE_ENV,
          },
        }
        : undefined,
    });
  }
};
