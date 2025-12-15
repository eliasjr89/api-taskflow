// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import usersRoutes from "./routes/users.routes.js";
import userRoutes from "./routes/user.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import tagsRoutes from "./routes/tags.routes.js";
import taskStatusesRoutes from "./routes/taskStatuses.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";
import { AppError } from "./utils/AppError.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { limiter, hppMiddleware } from "./middleware/security.middleware.js";
const app = express();

/* ───────────── Middlewares globales ───────────── */
// app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/ping", (req, res) => res.send("pong"));

// Security
app.use(limiter);
app.use(hppMiddleware);

/* ───────────── Rutas API ───────────── */
app.use("/taskflow/users", usersRoutes);
app.use("/taskflow/user", userRoutes);
app.use("/taskflow/projects", projectsRoutes);
app.use("/taskflow/tasks", tasksRoutes);
app.use("/taskflow/tags", tagsRoutes);
app.use("/taskflow/task-statuses", taskStatusesRoutes);
app.use("/taskflow/auth", authRoutes);

// Swagger Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ───────────── Static files (después de las rutas API) ───────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);

// Handle 404
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);
export default app;
