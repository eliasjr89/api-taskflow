import { apiClient } from './setup.js';

describe('Security Layer E2E', () => {
  describe('Helmet (Security Headers)', () => {
    it('Debe incluir cabeceras de seguridad básicas de Helmet', async () => {
      const res = await apiClient.get('/ping');

      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('x-dns-prefetch-control', 'off');
      expect(res.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(res.headers).toHaveProperty('strict-transport-security');
    });
  });

  describe('Rate Limiter', () => {
    it('Debe incluir cabeceras de Rate Limit', async () => {
      const res = await apiClient.get('/ping');

      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('ratelimit-remaining');
    });
  });

  describe('HPP (HTTP Parameter Pollution)', () => {
    it('Debe prevenir que la polución de parámetros rompa la aplicación', async () => {
      const loginRes = await apiClient
        .post('/taskflow/auth/login')
        .send({ email: 'admin@taskflow.com', password: 'Admin123' });

      const adminToken = loginRes.body.data.token;

      // Enviamos duplicados - El repositorio ahora debe manejarlo sin dar 500
      const res = await apiClient
        .get('/taskflow/users?page=1&page=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Validamos que se tomó page=2 (la última)
      expect(res.body.pagination.page).toBe(2);
    });
  });
});
