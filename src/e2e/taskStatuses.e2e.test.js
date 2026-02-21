import { apiClient } from './setup.js';
import { prisma } from '../lib/prisma.js';

describe('E2E Task Statuses API', () => {
  let adminToken = '';
  let statusId = null;

  beforeAll(async () => {
    // 0. Resincronizar secuencia de IDs auto-incrementables para evitar colisión con el seed
    await prisma.$executeRawUnsafe(
      'SELECT setval(pg_get_serial_sequence(\'"task_statuses"\', \'id\'), coalesce(max(id),0) + 1, false) FROM "task_statuses";',
    );

    // 1. Autenticar Admin
    const loginRes = await apiClient
      .post('/taskflow/auth/login')
      .send({ email: 'admin@taskflow.com', password: 'Admin123' });

    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    // Limpieza
    if (statusId) {
      await prisma.taskStatus.deleteMany({ where: { id: statusId } });
    }
  });

  describe('POST /taskflow/task-statuses', () => {
    it('Debe crear un nuevo estado de tarea exitosamente', async () => {
      const payload = {
        name: 'In Progress - E2E',
      };

      const res = await apiClient
        .post('/taskflow/task-statuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(payload.name);

      statusId = res.body.data?.id;
    });

    it('Debe rechazar la creación si falta el nombre', async () => {
      const payload = {};

      const res = await apiClient
        .post('/taskflow/task-statuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /taskflow/task-statuses', () => {
    it('Debe devolver todos los estados de tarea', async () => {
      const res = await apiClient
        .get('/taskflow/task-statuses')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (statusId) {
        expect(res.body.data.some((s) => s.id === statusId)).toBe(true);
      }
    });
  });

  describe('GET /taskflow/task-statuses/:id', () => {
    it('Debe devolver un estado de tarea por ID', async () => {
      const res = await apiClient
        .get(`/taskflow/task-statuses/${statusId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(statusId);
    });
  });

  describe('PUT /taskflow/task-statuses/:id', () => {
    it('Debe actualizar el nombre de un estado', async () => {
      const payload = {
        name: 'Done - E2E Updated',
      };

      const res = await apiClient
        .put(`/taskflow/task-statuses/${statusId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(payload.name);
    });
  });

  describe('DELETE /taskflow/task-statuses/:id', () => {
    it('Debe eliminar el estado de tarea por completo', async () => {
      const res = await apiClient
        .delete(`/taskflow/task-statuses/${statusId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Debe retornar 404 si el estado ya fue eliminado', async () => {
      const res = await apiClient
        .delete(`/taskflow/task-statuses/${statusId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
