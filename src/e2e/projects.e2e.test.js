import { apiClient, setupTestDB } from './setup.js';
import { prisma } from '../lib/prisma.js';

describe('E2E Projects API', () => {
  setupTestDB();

  let adminToken = '';
  let projectId = null;
  let managerUserId = null;
  let userUserId = null;
  // Utilizaremos un admin fijo si la DB ya esta poblada o lo creamos al vuelo.

  beforeAll(async () => {
    // 1. Obtener Token de Admin
    const loginRes = await apiClient.post('/taskflow/auth/login').send({
      email: 'admin@taskflow.com',
      password: 'Admin123',
    });

    if (!loginRes.body?.data?.token) {
      console.error('LOGIN FAILED IN PROJECTS:', loginRes.body);
    }
    adminToken = loginRes.body.data.token;

    // 2. Obtener IDs dinámicos de manager y user desde la BD
    const manager = await prisma.user.findUnique({
      where: { username: 'manager' },
    });
    const user = await prisma.user.findUnique({ where: { username: 'user' } });
    managerUserId = manager?.id;
    userUserId = user?.id;
  });

  describe('GET /taskflow/projects', () => {
    it('Debe retornar status 200 y una lista de proyectos', async () => {
      const res = await apiClient
        .get('/taskflow/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Debe devolver 401 si no hay token de autorizacion', async () => {
      const res = await apiClient.get('/taskflow/projects');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /taskflow/projects', () => {
    it('Debe crear un nuevo proyecto exitosamente', async () => {
      const userIds = [managerUserId, userUserId].filter(Boolean);
      const payload = {
        name: 'E2E Test Project',
        description: 'Testing endpoints in Jest',
        ...(userIds.length > 0 && { user_ids: userIds }),
      };

      const res = await apiClient
        .post('/taskflow/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(payload.name);

      // Guardar el ID para las siguientes pruebas
      projectId = res.body.data.id;
    });

    it('Debe fallar al enviar campos inválidos (Ej: user_ids negativo/0)', async () => {
      const payload = {
        name: 'E2E Invalid Zod',
        user_ids: [0],
      };

      const res = await apiClient
        .post('/taskflow/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /taskflow/projects/:id', () => {
    it('Debe retornar un proyecto específico', async () => {
      const res = await apiClient
        .get(`/taskflow/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(projectId);
    });

    it('Debe devolver 404 si el proyecto no existe', async () => {
      const res = await apiClient
        .get('/taskflow/projects/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /taskflow/projects/:id', () => {
    it('Debe actualizar un proyecto existente', async () => {
      const res = await apiClient
        .put(`/taskflow/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'E2E Test Project Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('E2E Test Project Updated');
    });
  });

  describe('DELETE /taskflow/projects/:id', () => {
    it('Debe eliminar un proyecto existente', async () => {
      const res = await apiClient
        .delete(`/taskflow/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Debe devolver 404 al intentar obtener el proyecto eliminado', async () => {
      const res = await apiClient
        .get(`/taskflow/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
