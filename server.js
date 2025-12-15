import "dotenv/config"; // Still needed if loading .env before src/config/env imports, generally redundant if env.js does it, but safe.
import app from "./src/app.js";
import { connectDB } from "./src/db/database.js";
import { env } from "./src/config/env.js";

const PORT = env.PORT;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(
        `Swagger Docs available at http://localhost:${PORT}/api-docs`
      );
    });

    const shutdown = (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
