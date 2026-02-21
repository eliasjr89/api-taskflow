import { createClient } from 'redis';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

let redisClient;

export const initRedis = async () => {
  if (env.NODE_ENV === 'test') {
    return;
  }

  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => logger.error('❌ Redis error:', err));
  redisClient.on('connect', () => {
    logger.info('✅ Connected to Redis successfully');
  });

  await redisClient.connect();
};

export const getRedisClient = () => redisClient;
