import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://taskflow-app-todolist.vercel.app',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Middleware de Autenticación
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      // Verify token (simplified, ideally import verify logic or use authService)
      // We need jsonwebtoken here.
      // Let's assume standard verify for now.
      const jwt = (await import('jsonwebtoken')).default;
      const { env } = await import('../config/env.js');

      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded; // { userId, role, sessionId }
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(
      `🔌 Cliente conectado: ${socket.id} (User: ${socket.user?.userId}, Role: ${socket.user?.role})`,
    );

    // Unir a sala personal
    socket.join(`user:${socket.user.userId}`);

    // Unir a sala de admin si corresponde
    if (['admin', 'manager'].includes(socket.user.role)) {
      socket.join('admin-room');
    }

    // Notify Admins of new connection
    socket.to('admin-room').emit('admin:session-connected', {
      userId: socket.user.userId,
      socketId: socket.id,
      timestamp: new Date(),
    });

    // Listen for Kill Session (Admin only)
    socket.on('admin:kill-session', async (targetUserId) => {
      if (['admin', 'manager'].includes(socket.user.role)) {
        // Find sockets for this user
        const sockets = await io.in(`user:${targetUserId}`).fetchSockets();
        sockets.forEach((s) => {
          s.emit('force_disconnect', {
            message: 'Session terminated by admin',
          });
          s.disconnect(true);
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`❌ Cliente desconectado: ${socket.id}`);
      // Notify Admins
      io.to('admin-room').emit('admin:session-disconnected', {
        userId: socket.user.userId,
        socketId: socket.id,
        timestamp: new Date(),
      });
    });
  });

  // Start Health Stats Loop (every 5s)
  const startHealthEmission = async () => {
    try {
      // Dynamic import to avoid earlier load issues
      const AdminService = await import('../services/adminService.js');

      setInterval(async () => {
        // Only if admins are connected
        const room = io.sockets.adapter.rooms.get('admin-room');
        if (room && room.size > 0) {
          try {
            const health = await AdminService.getSystemHealth();
            io.to('admin-room').emit('admin:system-health', health);
          } catch (err) {
            logger.error('Error emitting health stats:', err.message);
          }
        }
      }, 5000);
    } catch (err) {
      logger.error(
        'Failed to import AdminService for socket health stats',
        err,
      );
    }
  };

  startHealthEmission();

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado!');
  }
  return io;
};
