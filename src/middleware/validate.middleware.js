// src/middleware/validate.middleware.js
import { AppError } from '../utils/AppError.js';

/**
 * Middleware factory for validating request data against Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys from the validated data
    });

    if (error) {
      // Format error messages
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      // Return first error message for simplicity, or all errors
      const message = errorMessages.map((err) => err.message).join(', ');

      return next(new AppError(message, 400));
    }

    // Replace request data with validated and sanitized data
    // In Express 5, query and params are readonly, so we need to handle them differently
    if (property === 'query' || property === 'params') {
      // For readonly properties, we merge the validated data back
      Object.keys(req[property]).forEach((key) => delete req[property][key]);
      Object.assign(req[property], value);
    } else {
      // For body, we can replace directly
      req[property] = value;
    }
    next();
  };
};

/**
 * Validate request parameters (URL params)
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate query string parameters
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate request body
 */
export const validateBody = (schema) => validate(schema, 'body');
