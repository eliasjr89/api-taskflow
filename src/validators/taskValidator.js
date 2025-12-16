// src/validators/taskValidator.js
import Joi from 'joi';

export const createTaskSchema = Joi.object({
  description: Joi.string().min(3).max(500).required().messages({
    'string.min': 'La descripción debe tener al menos 3 caracteres',
    'string.max': 'La descripción no puede exceder 500 caracteres',
    'any.required': 'La descripción es obligatoria',
  }),

  project_id: Joi.number().integer().positive().required().messages({
    'number.base': 'El ID del proyecto debe ser un número',
    'number.positive': 'El ID del proyecto debe ser positivo',
    'any.required': 'El ID del proyecto es obligatorio',
  }),

  status_id: Joi.number().integer().positive().required().messages({
    'number.base': 'El ID del estado debe ser un número',
    'number.positive': 'El ID del estado debe ser positivo',
    'any.required': 'El ID del estado es obligatorio',
  }),

  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('low')
    .messages({
      'any.only': 'La prioridad debe ser: low, medium, high o urgent',
    }),

  completed: Joi.boolean().default(false),

  due_date: Joi.date().iso().allow(null).messages({
    'date.format': 'La fecha debe estar en formato ISO 8601',
  }),

  user_ids: Joi.array().items(Joi.number().integer().positive()).messages({
    'number.base': 'Los IDs de usuarios deben ser números',
    'number.positive': 'Los IDs de usuarios deben ser positivos',
  }),

  tag_ids: Joi.array().items(Joi.number().integer().positive()).messages({
    'number.base': 'Los IDs de etiquetas deben ser números',
    'number.positive': 'Los IDs de etiquetas deben ser positivos',
  }),
});

export const updateTaskSchema = Joi.object({
  description: Joi.string().min(3).max(500).messages({
    'string.min': 'La descripción debe tener al menos 3 caracteres',
    'string.max': 'La descripción no puede exceder 500 caracteres',
  }),

  status_id: Joi.number().integer().positive().messages({
    'number.base': 'El ID del estado debe ser un número',
    'number.positive': 'El ID del estado debe ser positivo',
  }),

  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').messages({
    'any.only': 'La prioridad debe ser: low, medium, high o urgent',
  }),

  completed: Joi.boolean(),

  due_date: Joi.date().iso().allow(null).messages({
    'date.format': 'La fecha debe estar en formato ISO 8601',
  }),

  user_ids: Joi.array().items(Joi.number().integer().positive()).messages({
    'number.base': 'Los IDs de usuarios deben ser números',
    'number.positive': 'Los IDs de usuarios deben ser positivos',
  }),

  tag_ids: Joi.array().items(Joi.number().integer().positive()).messages({
    'number.base': 'Los IDs de etiquetas deben ser números',
    'number.positive': 'Los IDs de etiquetas deben ser positivos',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  });

export const addUsersToTaskSchema = Joi.object({
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

export const addTagsToTaskSchema = Joi.object({
  tag_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      'array.min': 'Debe proporcionar al menos una etiqueta',
      'any.required': 'Los IDs de etiquetas son obligatorios',
      'number.base': 'Los IDs de etiquetas deben ser números',
      'number.positive': 'Los IDs de etiquetas deben ser positivos',
    }),
});
