import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

export const cacheMiddleware = () => {
  return async (req, res, next) => {
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isOpen) {
      return next();
    }

    const key = req.originalUrl;
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        // Enviar repuesta cacheada
        logger.info(`[Redis] HIT - Enviando caché de: ${key}`);
        return res.status(200).json(JSON.parse(cachedData));
      }

      logger.info(`[Redis] MISS - No hay recolección para: ${key}`);
      next();
    } catch (err) {
      logger.error('Redis Fetch Error:', err);
      next();
    }
  };
};

export const clearCache = async (pattern) => {
  const redisClient = getRedisClient();
  if (!redisClient || !redisClient.isOpen) {
    return;
  }
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.error('Error clearing cache:', error);
  }
};

export const clearCacheMw = (pattern) => {
  return async (req, res, next) => {
    await clearCache(pattern);
    next();
  };
};
