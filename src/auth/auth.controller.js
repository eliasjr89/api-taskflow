// src/auth/auth.controller.js
import * as AuthService from "../services/authService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const login = catchAsync(async (req, res) => {
  const { token, user } = await AuthService.login(req.body);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { token, user },
  });
});

export const register = catchAsync(async (req, res) => {
  const { token, user } = await AuthService.register(req.body);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: { token, user },
  });
});
