import 'dotenv/config';
import app from './src/app.js';
import { prisma } from './src/lib/prisma.js';
import { env } from './src/config/env.js';
import { initSocket } from './src/lib/socket.js';
import { initRedis } from './src/lib/redis.js';

const PORT = env.PORT;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected via Prisma');

    await initRedis();

    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(
        `Swagger Docs available at http://localhost:${PORT}/api-docs`,
      );
    });

    // Initialize Socket.io
    initSocket(server);

    const shutdown = (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      process.exit(1);
    });

    process.on('uncaughtException', (err) => {
      console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
