import { env } from './src/config/env.js';
console.log('Env loaded:', !!env);
console.log('JWT_SECRET exists:', !!env.JWT_SECRET);
