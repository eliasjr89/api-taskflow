import { apiClient, setupTestDB } from './setup.js';
import { prisma } from '../lib/prisma.js';

describe('E2E Tasks API', () => {
  setupTestDB();

  let adminToken = '';
  let projectId = null;
  let taskId = null;
  let statusId = null;

  beforeAll(async () => {
    // 1. Obtener Token de Admin
    const loginRes = await apiClient
      .post('/taskflow/auth/login')
      .send({ email: 'admin@taskflow.com', password: 'Admin123' });
    if (!loginRes.body?.data?.token) {
      console.error('LOGIN FAILED IN TASKS:', loginRes.body);
    }
    adminToken = loginRes.body.data.token;

    // Asegurar que existan estados de tarea (pueden no existir tras db:reset)
    const statusCount = await prisma.taskStatus.count();
    if (statusCount === 0) {
      await prisma.taskStatus.createMany({
        data: [
          { name: 'pending' },
          { name: 'in_progress' },
          { name: 'completed' },
          { name: 'cancelled' },
        ],
      });
    }

    // Obtener el primer status disponible de la BD (dinámico)
    const firstStatus = await prisma.taskStatus.findFirst({
      orderBy: { id: 'asc' },
    });
    statusId = firstStatus?.id;

    // Crear un proyecto de prueba para asignar la tarea
    const projRes = await apiClient
      .post('/taskflow/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Task E2E Test Project',
        description: 'For Task testing',
      });

    // El projectId viene del proyecto creado; no usar fallback a IDs inexistentes
    projectId = projRes.body?.data?.id ?? null;
  });

  describe('POST /taskflow/tasks', () => {
    it('Debe crear una nueva tarea exitosamente', async () => {
      const payload = {
        description: 'E2E Test Task',
        priority: 'high',
        status_id: statusId, // dinámico, primer estado disponible
        project_id: projectId,
      };

      const res = await apiClient
        .post('/taskflow/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      taskId = res.body.data.id;
    });
  });

  describe('GET /taskflow/tasks', () => {
    it('Debe retornar status 200 y una lista de tareas', async () => {
      const res = await apiClient
        .get('/taskflow/tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /taskflow/tasks/:id', () => {
    it('Debe retornar una tarea específica', async () => {
      const res = await apiClient
        .get(`/taskflow/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(taskId);
    });
  });

  describe('PUT /taskflow/tasks/:id', () => {
    it('Debe actualizar una tarea existente', async () => {
      const res = await apiClient
        .put(`/taskflow/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Task Updated E2E' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Task Updated E2E');
    });
  });

  describe('DELETE /taskflow/tasks/:id', () => {
    it('Debe eliminar una tarea existente', async () => {
      const res = await apiClient
        .delete(`/taskflow/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
