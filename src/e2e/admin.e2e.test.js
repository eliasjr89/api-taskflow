import { apiClient } from './setup.js';
import { prisma } from '../lib/prisma.js';

describe('E2E Admin API', () => {
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    // 1. Obtener Token de Admin
    const adminRes = await apiClient
      .post('/taskflow/auth/login')
      .send({ email: 'admin@taskflow.com', password: 'Admin123' });

    adminToken = adminRes.body.data.token;

    // 2. Obtener Token de Usuario Normal
    const userRes = await apiClient
      .post('/taskflow/auth/login')
      .send({ email: 'user@taskflow.com', password: 'User123' });

    userToken = userRes.body.data.token;
  });

  describe('GET /taskflow/admin/stats', () => {
    it('Debe devolver métricas de DB a un Admin', async () => {
      const res = await apiClient
        .get('/taskflow/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('version');
    });

    it('Debe bloquear acceso a usuarios sin permisos (User)', async () => {
      const res = await apiClient
        .get('/taskflow/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /taskflow/admin/health', () => {
    it('Debe devolver el healthcheck corporativo', async () => {
      const res = await apiClient
        .get('/taskflow/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('dbStatus');
      expect(res.body.data).toHaveProperty('memory');
    });
  });

  describe('GET /taskflow/admin/roles', () => {
    it('Debe listar los roles de sistema para Admin', async () => {
      const res = await apiClient
        .get('/taskflow/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /taskflow/admin/activity', () => {
    it('Debe listar logs de auditoría para Admin', async () => {
      const res = await apiClient
        .get('/taskflow/admin/activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
