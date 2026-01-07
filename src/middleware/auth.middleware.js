import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as UserRepository from '../repositories/userRepository.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // If not in header, check cookie
  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Check Session Validity
    if (decoded.sessionId) {
      const session = await UserRepository.findSessionById(decoded.sessionId);
      if (!session) {
        return res.status(401).json({ message: 'Session expired or revoked' });
      }
    }

    // Load full user with permissions
    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      return res
        .status(401)
        .json({ message: 'User belonging to this token no longer exists' });
    }

    req.user = user; // { ...user, permissions: ['manage:users', ...] }
    req.user.userId = user.id; // For backward compatibility
    req.sessionId = decoded.sessionId;
    next();
  } catch {
    // console.error('Auth Middleware Verification Error:', error.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// RBAC: Check for specific permissions OR specific roles (legacy support)
export const restrictTo = (...allowed) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const userRole = req.user.role;

    // Check if user has ANY of the allowed permissions or roles
    const hasPermission = allowed.some(
      (a) => userPermissions.includes(a) || userRole === a,
    );

    if (!hasPermission) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};
