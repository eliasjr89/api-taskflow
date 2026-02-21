import { apiClient } from './setup.js';
import { prisma } from '../lib/prisma.js';

describe('E2E Announcements API', () => {
  let adminToken = '';
  let userToken = '';
  let announcementId = null;

  beforeAll(async () => {
    // 0. Resincronizar secuencia de IDs para evitar colisiones con el seed
    await prisma.$executeRawUnsafe(
      'SELECT setval(pg_get_serial_sequence(\'"announcements"\', \'id\'), coalesce(max(id),0) + 1, false) FROM "announcements";',
    );

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

  afterAll(async () => {
    // Limpieza
    if (announcementId) {
      // Usamos deleteMany para evitar errores si no existe
      await prisma.announcement.deleteMany({
        where: { id: announcementId },
      });
    }
  });

  describe('POST /taskflow/announcements', () => {
    it('Debe permitir a un Admin crear un anuncio', async () => {
      const payload = {
        title: 'Mantenimiento Programado',
        message: 'El sistema estará fuera de línea por 2 horas.',
        type: 'warning',
      };

      const res = await apiClient
        .post('/taskflow/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(payload.title);
      announcementId = res.body.data.id;
    });

    it('Debe rechazar la creación por un usuario normal (User)', async () => {
      const payload = {
        title: 'Intento de Hack',
        message: 'No debería poder publicar esto.',
      };

      const res = await apiClient
        .post('/taskflow/announcements')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /taskflow/announcements/active', () => {
    it('Debe permitir a cualquier usuario ver anuncios activos', async () => {
      const res = await apiClient
        .get('/taskflow/announcements/active')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // El anuncio que creamos arriba debería estar aquí
      expect(res.body.data.some((a) => a.id === announcementId)).toBe(true);
    });
  });

  describe('GET /taskflow/announcements', () => {
    it('Debe permitir a un Admin ver todos los anuncios (incluyendo inactivos)', async () => {
      const res = await apiClient
        .get('/taskflow/announcements')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('DELETE /taskflow/announcements/:id', () => {
    it('Debe desactivar un anuncio exitosamente', async () => {
      const res = await apiClient
        .delete(`/taskflow/announcements/${announcementId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Announcement deactivated');
    });

    it('Debe reflejar que el anuncio ya no está activo', async () => {
      const res = await apiClient
        .get('/taskflow/announcements/active')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body.data.some((a) => a.id === announcementId)).toBe(false);
    });
  });
});
