import { jest } from '@jest/globals';

// 1. Mock dependencies with unstable_mockModule before any import
jest.unstable_mockModule('../../../repositories/userRepository.js', () => ({
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  createSession: jest.fn(),
  findSessionById: jest.fn(),
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

// 2. Import modules dynamically after mocking
const AuthService = await import('../../../services/authService.js');
const UserRepository = await import('../../../repositories/userRepository.js');
const bcrypt = (await import('bcryptjs')).default;
const jwt = (await import('jsonwebtoken')).default;
const { AppError } = await import('../../../utils/AppError.js');

describe('AuthService Unit Tests (ESM)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Password123',
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    };

    it('Debe lanzar error 401 si el usuario no existe', async () => {
      UserRepository.findByEmail.mockResolvedValue(null);

      await expect(AuthService.login(loginData)).rejects.toThrow(
        /Invalid credentials/,
      );
    });

    it('Debe lanzar error 401 si la contraseña es incorrecta', async () => {
      UserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(AuthService.login(loginData)).rejects.toThrow(
        /Invalid credentials/,
      );
    });

    it('Debe retornar token y usuario si las credenciales son válidas', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
        roleId: 2,
        permissions: ['read:tasks'],
        username: 'testuser',
      };
      const mockSession = { id: 'session_id' };

      UserRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      UserRepository.createSession.mockResolvedValue(mockSession);
      jwt.sign.mockReturnValue('mock_token');

      const result = await AuthService.login(loginData);

      expect(result).toHaveProperty('token', 'mock_token');
      expect(result.user.email).toBe(mockUser.email);
      expect(UserRepository.createSession).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const userData = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'Password123',
    };

    it('Debe lanzar error 400 si el email ya existe', async () => {
      UserRepository.findByEmail.mockResolvedValue({ id: 1 });

      await expect(AuthService.register(userData)).rejects.toThrow(
        /Email already in use/,
      );
    });

    it('Debe crear el usuario y sesion si los datos son nuevos', async () => {
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_password');
      UserRepository.create.mockResolvedValue({
        id: 2,
        ...userData,
        password: 'hashed_password',
      });
      UserRepository.createSession.mockResolvedValue({ id: 's2' });
      jwt.sign.mockReturnValue('new_token');

      const result = await AuthService.register(userData);

      expect(result).toHaveProperty('token', 'new_token');
      expect(UserRepository.create).toHaveBeenCalled();
    });
  });
});
