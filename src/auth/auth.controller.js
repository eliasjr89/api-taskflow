// src/auth/auth.controller.js
import * as AuthService from '../services/authService.js';
import * as AuditService from '../services/auditService.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

export const login = catchAsync(async (req, res, next) => {
  const { email, password, loginType } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Delegate business logic to service
  try {
    const { token, user } = await AuthService.login({
      email,
      password,
      loginType,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Set HTTP Only Cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    res.cookie('token', token, cookieOptions);

    await AuditService.logAction({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, loginType },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user },
    });
  } catch (error) {
    logger.error('❌ Login failed in Service:', { error: error.message });
    throw error;
  }
});

export const register = catchAsync(async (req, res) => {
  const { token, user } = await AuthService.register({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  await AuditService.logAction({
    userId: user.id,
    action: 'REGISTER',
    entityType: 'USER',
    entityId: user.id,
    details: { email: user.email },
    req,
  });
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { token, user },
  });
});

export const logout = catchAsync(async (req, res) => {
  // Extract session ID from decoded token (auth middleware attaches user/session)
  const sessionId = req.user?.sessionId;

  if (sessionId) {
    await AuthService.logout(sessionId);
  }

  // Clear HTTP Only Cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});
