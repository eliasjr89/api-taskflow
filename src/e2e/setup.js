import request from 'supertest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';
import { pool } from '../db/database.js';

export const apiClient = request(app);

// Helper para limpiar la DB o inicializarla en cada test si hiciera falta.
export const setupTestDB = () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Evitar colgado de Jest por handles vivos
    await prisma.$disconnect();
    if (pool) {
      await pool.end();
    }
  });
};
