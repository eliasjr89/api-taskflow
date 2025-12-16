// src/validators/projectValidator.js
import Joi from 'joi';

export const createProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'El nombre del proyecto debe tener al menos 3 caracteres',
    'string.max': 'El nombre del proyecto no puede exceder 100 caracteres',
    'any.required': 'El nombre del proyecto es obligatorio',
  }),

  description: Joi.string().max(500).allow(null, '').messages({
    'string.max': 'La descripción no puede exceder 500 caracteres',
  }),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).messages({
    'string.min': 'El nombre del proyecto debe tener al menos 3 caracteres',
    'string.max': 'El nombre del proyecto no puede exceder 100 caracteres',
  }),

  description: Joi.string().max(500).allow(null, '').messages({
    'string.max': 'La descripción no puede exceder 500 caracteres',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  });

export const addUsersToProjectSchema = Joi.object({
  user_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      'array.min': 'Debe proporcionar al menos un usuario',
      'any.required': 'Los IDs de usuarios son obligatorios',
      'number.base': 'Los IDs de usuarios deben ser números',
      'number.positive': 'Los IDs de usuarios deben ser positivos',
    }),
});
