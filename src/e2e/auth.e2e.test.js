import { apiClient, setupTestDB } from './setup.js';
import { prisma } from '../lib/prisma.js';

describe('E2E Auth API', () => {
  setupTestDB();

  let adminToken = '';
  let standardToken = '';

  const mockUser = {
    username: 'test_student_E2E',
    email: 'test_student_E2E@taskflow.com',
    password: 'Password123!',
    name: 'Test',
    lastname: 'Student',
  };

  const cleanUpMockUser = async () => {
    const user = await prisma.user.findUnique({
      where: { email: mockUser.email },
    });
    if (user) {
      await prisma.auditLog.deleteMany({ where: { userId: user.id } });
      await prisma.activeSession.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  };

  beforeAll(async () => {
    await cleanUpMockUser();
  });

  afterAll(async () => {
    // Al concluir, borramos al usuario inventado para limpiar el entorno
    await cleanUpMockUser();
  });

  describe('POST /taskflow/auth/register', () => {
    it('Debe registrar un nuevo usuario exitosamente', async () => {
      const res = await apiClient
        .post('/taskflow/auth/register')
        .send(mockUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(mockUser.email);
      expect(res.body.data.user.role).toBe('user');
    });

    it('Debe arrojar 400 Bad Request si faltan parámetros (esquema Zod)', async () => {
      const res = await apiClient
        .post('/taskflow/auth/register')
        .send({ username: 'SoloNombre' }); // Faltan password y email

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('Debe arrojar 409 Conflict si el email ya existe', async () => {
      const res = await apiClient
        .post('/taskflow/auth/register')
        .send(mockUser);

      expect(res.status).toBe(400); // El API arroja 400 por Zod o Service validation
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Email already in use/i);
    });
  });

  describe('POST /taskflow/auth/login', () => {
    it('Debe iniciar sesión de usuario exitosamente y retornar un JWT', async () => {
      const res = await apiClient.post('/taskflow/auth/login').send({
        email: mockUser.email,
        password: mockUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();

      standardToken = res.body.data.token;
    });

    it('Debe iniciar sesión correctamente para el administrador (Seed DB)', async () => {
      const res = await apiClient.post('/taskflow/auth/login').send({
        email: 'admin@taskflow.com',
        password: 'Admin123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();

      adminToken = res.body.data.token;
    });

    it('Debe arrojar 401 Unauthorized si la contraseña es incorrecta', async () => {
      const res = await apiClient.post('/taskflow/auth/login').send({
        email: mockUser.email,
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Debe arrojar 404 No Encontrado si el usuario no existe', async () => {
      const res = await apiClient.post('/taskflow/auth/login').send({
        email: 'not_existing_mail_ficticio@taskflow.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Middleware JWT Security Check (authMiddleware)', () => {
    it('Debe devolver 401 en RUTAS PROTEGIDAS omitiendo el campo Bearer', async () => {
      const res = await apiClient.get('/taskflow/projects');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Token missing/i);
    });

    it('Debe devolver 401 si el Bearer viaja corrupto o inventado', async () => {
      const res = await apiClient
        .get('/taskflow/projects')
        .set(
          'Authorization',
          'Bearer eyJhbGciOiJIUzI1NiJ9.CorruptedDataHere!!',
        );

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Invalid token/i);
    });
  });

  describe('POST /taskflow/auth/logout', () => {
    it('Debe cerrar sesión correctamente devolviendo HTTP 200', async () => {
      const res = await apiClient
        .post('/taskflow/auth/logout')
        .set('Authorization', `Bearer ${standardToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
