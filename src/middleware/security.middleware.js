// src/middleware/security.middleware.js
import rateLimit from "express-rate-limit";
import hpp from "hpp";

// Rate Limiting
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:
    process.env.NODE_ENV === "test"
      ? 100000
      : process.env.NODE_ENV === "development"
        ? 50000
        : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
});

// HTTP Parameter Pollution
export const hppMiddleware = hpp();
