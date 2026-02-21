// src/services/authService.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UserRepository from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';

const signToken = (id, role, sessionId) => {
  return jwt.sign({ userId: id, role, sessionId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const login = async ({
  email,
  password,
  ipAddress,
  userAgent,
  loginType,
}) => {
  const user = await UserRepository.findByEmail(email);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  // Determine effective role (Role Relation takes precedence over legacy string)
  const effectiveRole = (
    user.roleRel?.name ||
    user.role ||
    'user'
  ).toLowerCase();

  logger.debug('🔍 RBAC Check:', {
    loginType,
    effectiveRole,
    legacyRole: user.role,
    roleId: user.roleId,
  });

  // Separación estricta: la card de usuario solo acepta rol 'user'
  if (loginType === 'user' && effectiveRole !== 'user') {
    logger.warn('❌ Role mismatch: Non-user role trying to use User form', {
      effectiveRole,
    });
    throw new AppError(
      'Only standard users can access the user login form',
      403,
    );
  }

  // Separación estricta: la card de admin solo acepta rol 'admin'
  if (loginType === 'admin' && effectiveRole !== 'admin') {
    logger.warn('❌ Role mismatch: Non-admin role trying to use Admin form', {
      effectiveRole,
    });
    throw new AppError(
      'Only administrators can access the admin login form',
      403,
    );
  }

  logger.debug('✅ Role validation passed');

  // Self-Healing: Backfill roleId if missing (Transition to RBAC)
  if (!user.roleId) {
    try {
      logger.info(
        `🔄 Backfilling roleId for user ${user.id} with role ${user.role}`,
      );
      // Find the target role ID based on the effective role
      const targetRole = await prisma.role.findUnique({
        where: { name: effectiveRole },
        select: { id: true },
      });

      if (targetRole) {
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { roleId: targetRole.id },
        });
        if (updated) {
          user.roleId = targetRole.id; // Update user object in memory
          logger.info('✅ Backfill successful');
        }
      } else {
        logger.warn(
          `⚠️ Could not find Role record for effective role '${effectiveRole}'`,
        );
      }
    } catch (err) {
      logger.error('❌ Failed to backfill roleId:', {
        error: err.message,
        userId: user.id,
        effectiveRole,
      });
      // Don't block login for this, just log error
    }
  }

  // Create Active Session
  const session = await UserRepository.createSession({
    userId: user.id,
    ipAddress,
    userAgent,
    tokenHash: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  });

  // Use the helper to sign token (consistent with env)
  const token = signToken(user.id, user.role, session.id);

  // Update session with token hash (for revocation)
  // For simplicity preventing another DB call, we might skip hash or do it async.
  // But let's do it right.
  // actually, we don't strictly need the token hash if we validate by session ID existence.
  // but let's leave it as a placeholder or update if strictly needed.

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role, // Keep for frontend compat
      roleId: user.roleId, // New
      permissions: user.permissions, // New
      username: user.username,
      name: user.name,
      lastname: user.lastname,
      profile_image: user.profile_image,
    },
  };
};

export const logout = async (sessionId) => {
  if (sessionId) {
    await UserRepository.deleteSession(sessionId);
  }
};

export const impersonate = async (adminUserId, targetUserId) => {
  // Verify admin has permission? Middleware does most, but logic here too.
  const targetUser = await UserRepository.findById(targetUserId);
  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  // Mark session as impersonated?
  // tailored session...
  const session = await UserRepository.createSession({
    userId: targetUser.id,
    userAgent: `Impersonated by Admin ${adminUserId}`,
    ipAddress: 'Internal',
  });

  const token = signToken(targetUser.id, targetUser.role, session.id);

  return {
    token,
    user: targetUser,
  };
};

export const register = async (userData) => {
  const { ipAddress, userAgent, ...rest } = userData;

  const existingUser = await UserRepository.findByEmail(rest.email);
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  const existingUsername = await UserRepository.findByUsername(rest.username);
  if (existingUsername) {
    throw new AppError('Username already in use', 400);
  }

  const hashedPassword = await bcrypt.hash(rest.password, 12);
  const newUser = await UserRepository.create({
    ...rest,
    password: hashedPassword,
  });

  // Create Active Session
  const session = await UserRepository.createSession({
    userId: newUser.id,
    ipAddress,
    userAgent,
    tokenHash: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  });

  const token = signToken(newUser.id, newUser.role, session.id);
  return { token, user: newUser };
};
