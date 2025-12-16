// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import usersRoutes from './routes/users.routes.js';
import userRoutes from './routes/user.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import tagsRoutes from './routes/tags.routes.js';
import taskStatusesRoutes from './routes/taskStatuses.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import { globalErrorHandler } from './middleware/error.middleware.js';
import { AppError } from './utils/AppError.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { limiter, hppMiddleware } from './middleware/security.middleware.js';
const app = express();

/* ───────────── Middlewares globales ───────────── */
// Trust proxy is required for Vercel/Heroku/etc to get correct IP
app.set('trust proxy', 1);
app.disable('etag'); // Disable 304 Cache responses for dev clarity

// app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = [
  'http://localhost:5173', // Vue Dev Server
  'http://localhost:3000', // Backend/Old Dashboard
];

if (process.env.ALLOWED_ORIGIN) {
  allowedOrigins.push(process.env.ALLOWED_ORIGIN);
}
// Support comma separated list as well
if (process.env.ALLOWED_ORIGINS) {
  const origins = process.env.ALLOWED_ORIGINS.split(',');
  allowedOrigins.push(...origins.map((o) => o.trim()));
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) === -1) {
        // For dev flexibility, you might want to allow all localhost in dev
        if (process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }

        const msg =
          'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/ping', (req, res) => res.send('pong'));

// Security
app.use(limiter);
app.use(hppMiddleware);

/* ───────────── Rutas API ───────────── */
app.use('/taskflow/users', usersRoutes);
app.use('/taskflow/user', userRoutes);
app.use('/taskflow/projects', projectsRoutes);
app.use('/taskflow/tasks', tasksRoutes);
app.use('/taskflow/tags', tagsRoutes);
app.use('/taskflow/task-statuses', taskStatusesRoutes);
app.use('/taskflow/auth', authRoutes);
app.use('/taskflow/admin', adminRoutes); // Admin routes

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ───────────── Static files (después de las rutas API) ───────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'TaskFlow API is running',
    documentation: '/api-docs',
  });
});

// Handle 404
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);
export default app;
