import "dotenv/config";
import app from "../src/app.js";
import { connectDB } from "../src/db/database.js";

// Initialize database connection for serverless environment
let isDbConnected = false;

const initializeDB = async () => {
  if (!isDbConnected) {
    try {
      await connectDB();
      isDbConnected = true;
      console.log("✅ Database initialized for serverless function");
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
      throw error;
    }
  }
};

// Vercel serverless function handler
export default async (req, res) => {
  try {
    // Ensure DB is connected before handling requests
    await initializeDB();

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
