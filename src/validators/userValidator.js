// src/validators/userValidator.js
import Joi from 'joi';

export const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum':
      'El nombre de usuario solo puede contener caracteres alfanuméricos',
    'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
    'string.max': 'El nombre de usuario no puede exceder 30 caracteres',
    'any.required': 'El nombre de usuario es obligatorio',
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'Debe proporcionar un email válido',
    'any.required': 'El email es obligatorio',
  }),

  password: Joi.string().min(6).max(100).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'string.max': 'La contraseña no puede exceder 100 caracteres',
    'any.required': 'La contraseña es obligatoria',
  }),

  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 50 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),

  lastname: Joi.string().min(2).max(50).required().messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'string.max': 'El apellido no puede exceder 50 caracteres',
    'any.required': 'El apellido es obligatorio',
  }),

  role: Joi.string()
    .valid('user', 'manager', 'admin')
    .default('user')
    .messages({
      'any.only': 'El rol debe ser: user, manager o admin',
    }),
});

export const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).messages({
    'string.alphanum':
      'El nombre de usuario solo puede contener caracteres alfanuméricos',
    'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
    'string.max': 'El nombre de usuario no puede exceder 30 caracteres',
  }),

  email: Joi.string().email().messages({
    'string.email': 'Debe proporcionar un email válido',
  }),

  password: Joi.string().min(6).max(100).messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'string.max': 'La contraseña no puede exceder 100 caracteres',
  }),

  name: Joi.string().min(2).max(50).messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 50 caracteres',
  }),

  lastname: Joi.string().min(2).max(50).messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'string.max': 'El apellido no puede exceder 50 caracteres',
  }),

  role: Joi.string().valid('user', 'manager', 'admin').messages({
    'any.only': 'El rol debe ser: user, manager o admin',
  }),

  profile_image: Joi.string().uri().allow(null, '').messages({
    'string.uri': 'La imagen de perfil debe ser una URL válida',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  });

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe proporcionar un email válido',
    'any.required': 'El email es obligatorio',
  }),

  password: Joi.string().required().messages({
    'any.required': 'La contraseña es obligatoria',
  }),
});
