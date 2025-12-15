// src/controllers/userController.js
import * as UserService from "../services/userService.js";
import * as UserRepository from "../repositories/userRepository.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcrypt";

// Para rutas de perfil autenticado
export const getProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const user = await UserService.getUserById(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const updatedUser = await UserService.updateUser(userId, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

export const uploadUserAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const userId = req.user.userId;
  // Construir la URL completa
  const protocol = req.protocol;
  const host = req.get("host");
  const avatarUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

  const updatedUser = await UserService.updateUser(userId, {
    profile_image: avatarUrl,
  });

  res.status(200).json({
    success: true,
    message: "Avatar uploaded successfully",
    data: {
      imageUrl: avatarUrl,
      user: updatedUser,
    },
  });
});

// Para rutas de administración de usuarios
export const getAllUsers = catchAsync(async (req, res) => {
  const users = await UserRepository.findAll();
  res.status(200).json({
    success: true,
    data: users,
  });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const createUser = catchAsync(async (req, res) => {
  const { username, email, password, name, lastname } = req.body;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await UserRepository.create({
    username,
    email,
    password: hashedPassword,
    name,
    lastname,
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: newUser,
  });
});

export const updateUser = catchAsync(async (req, res) => {
  const updatedUser = await UserService.updateUser(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

export const deleteUser = catchAsync(async (req, res) => {
  await UserRepository.deleteById(req.params.id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
