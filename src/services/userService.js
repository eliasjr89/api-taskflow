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

  const updatedUser = await UserRepository.update(id, userData);
  return updatedUser;
};
