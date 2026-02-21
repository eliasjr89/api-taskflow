import { apiClient, setupTestDB } from './setup.js';

describe('E2E Users API', () => {
  setupTestDB();

  let adminToken = '';
  let userId = null;

  beforeAll(async () => {
    const loginRes = await apiClient
      .post('/taskflow/auth/login')
      .send({ email: 'admin@taskflow.com', password: 'Admin123' });
    adminToken = loginRes.body.data.token;
  });

  describe('POST /taskflow/users', () => {
    it('Debe crear un nuevo usuario', async () => {
      const ts = Date.now();
      const payload = {
        username: `e2e_user_${ts}`,
        email: `e2e_user_${ts}@test.com`,
        password: 'Password123!',
        name: 'E2E',
        lastname: 'Test',
        role: 'user',
      };

      const res = await apiClient
        .post('/taskflow/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      userId = res.body.data.id;
    });
  });

  describe('GET /taskflow/users', () => {
    it('Debe retornar lista de usuarios', async () => {
      const res = await apiClient
        .get('/taskflow/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /taskflow/users/:id', () => {
    it('Debe retornar un usuario específico', async () => {
      const res = await apiClient
        .get(`/taskflow/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(userId);
    });
  });

  describe('PUT /taskflow/users/:id', () => {
    it('Debe actualizar un usuario existente', async () => {
      const res = await apiClient
        .put(`/taskflow/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated E2E User' });

      if (res.status !== 200) {
        console.error('ERROR BODY UPDATE USER:', res.body);
      }

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated E2E User');
    });
  });

  describe('DELETE /taskflow/users/:id', () => {
    it('Debe eliminar el usuario', async () => {
      const res = await apiClient
        .delete(`/taskflow/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
