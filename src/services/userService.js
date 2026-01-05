// src/services/userService.js
import * as UserRepository from '../repositories/userRepository.js';
import { AppError } from '../utils/AppError.js';

export const getUserById = async (id) => {
  const user = await UserRepository.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

import bcrypt from 'bcrypt';

export const createUser = async (userData) => {
  // Check existence
  const existingEmail = await UserRepository.findByEmail(userData.email);
  if (existingEmail) {
    throw new AppError('Email already in use', 400);
  }

  const existingUsername = await UserRepository.findByUsername(
    userData.username,
  );
  if (existingUsername) {
    throw new AppError('Username already in use', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const newUser = await UserRepository.create({
    ...userData,
    password: hashedPassword,
  });

  // Assign tasks if provided
  if (userData.task_ids && Array.isArray(userData.task_ids)) {
    // We can reuse a repository method or loop.
    // Since we are in Service, let's call a repo method we will add.
    await UserRepository.assignTasks(newUser.id, userData.task_ids);
  }

  return newUser;
};

export const updateUser = async (id, userData) => {
  const user = await UserRepository.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Si se proporciona un email diferente, verificar que no esté en uso
  if (userData.email && userData.email !== user.email) {
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Si se proporciona un username diferente, verificar que no esté en uso
  if (userData.username && userData.username !== user.username) {
    const existingUsername = await UserRepository.findByUsername(
      userData.username,
    );
    if (existingUsername) {
      throw new AppError('Username already in use', 400);
    }
  }

  const finalData = { ...userData };
  if (userData.password) {
    finalData.password = await bcrypt.hash(userData.password, 12);
  }

  const updatedUser = await UserRepository.update(id, finalData);

  if (userData.task_ids && Array.isArray(userData.task_ids)) {
    await UserRepository.syncTasks(id, userData.task_ids);
  }

  return updatedUser;
};
