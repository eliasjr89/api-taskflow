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
    // 1. Support for Joi (legacy)
    if (typeof schema.validate === 'function') {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const message = error.details
          .map((detail) => detail.message)
          .join(', ');
        return next(new AppError(message, 400));
      }

      if (property === 'query' || property === 'params') {
        Object.keys(req[property]).forEach((key) => delete req[property][key]);
        Object.assign(req[property], value);
      } else {
        req[property] = value;
      }
      return next();
    }

    // 2. Support for Zod (new)
    // We assume Zod schemas in this project define the full request structure (e.g. { body: ..., params: ... })
    if (typeof schema.safeParse === 'function') {
      const requestData = {
        body: req.body,
        params: req.params,
        query: req.query,
      };

      const result = schema.safeParse(requestData);

      if (!result.success) {
        const message = result.error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        return next(new AppError(message, 400));
      }

      // Update request with validated data
      if (result.data.body) {
        req.body = result.data.body;
      }
      if (result.data.query) {
        Object.keys(req.query).forEach((key) => delete req.query[key]);
        Object.assign(req.query, result.data.query);
      }
      if (result.data.params) {
        Object.keys(req.params).forEach((key) => delete req.params[key]);
        Object.assign(req.params, result.data.params);
      }
      return next();
    }

    // Fallback or error
    next(new AppError('Invalid schema provided', 500));
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
