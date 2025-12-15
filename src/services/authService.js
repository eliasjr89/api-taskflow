// src/services/authService.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as UserRepository from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

const signToken = (id, role) => {
  return jwt.sign({ userId: id, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const login = async ({ email, password }) => {
  const user = await UserRepository.findByEmail(email);

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new AppError("Invalid credentials", 401);
  }

  // Use the helper to sign token (consistent with env)
  const token = signToken(user.id, user.role);

  return { token, user: { id: user.id, email: user.email, role: user.role } };
};

export const register = async (userData) => {
  const existingUser = await UserRepository.findByEmail(userData.email);
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  const existingUsername = await UserRepository.findByUsername(
    userData.username
  );
  if (existingUsername) {
    throw new AppError("Username already in use", 400);
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const newUser = await UserRepository.create({
    ...userData,
    password: hashedPassword,
  });

  const token = signToken(newUser.id, newUser.role);
  return { token, user: newUser };
};
