import { jest } from '@jest/globals';

// Define mocks before importing service
jest.unstable_mockModule('../../repositories/userRepository.js', () => ({
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  createSession: jest.fn(),
  syncLegacyRole: jest.fn(),
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
  },
  sign: jest.fn(),
}));

jest.unstable_mockModule('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '1h',
  },
}));

describe('AuthService', () => {
  let AuthService;
  let UserRepository;
  let bcrypt;
  let jwt;

  beforeAll(async () => {
    // Dynamic import after mocks are defined
    AuthService = await import('../authService.js');
    UserRepository = await import('../../repositories/userRepository.js');
    const bcryptModule = await import('bcrypt');
    bcrypt = bcryptModule.default;
    const jwtModule = await import('jsonwebtoken');
    jwt = jwtModule.default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'user',
      roleRel: { name: 'user' },
      username: 'testuser',
    };

    it('should login successfully with valid credentials', async () => {
      const mockSession = { id: 100 };

      UserRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      UserRepository.createSession.mockResolvedValue(mockSession);
      jwt.sign.mockReturnValue('mock-token');

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password',
        loginType: 'user',
      });

      expect(result).toHaveProperty('token', 'mock-token');
      expect(UserRepository.createSession).toHaveBeenCalled();
    });

    it('should enforce RBAC: Admin cannot login as User', async () => {
      const adminUser = {
        ...mockUser,
        role: 'admin',
        roleRel: { name: 'admin' },
      };
      UserRepository.findByEmail.mockResolvedValue(adminUser);
      bcrypt.compare.mockResolvedValue(true);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'password',
          loginType: 'user',
        }),
      ).rejects.toThrow('administrator or manager account');
    });

    it('should trigger self-healing if roleId is missing', async () => {
      const legacyUser = {
        id: 1,
        email: 'old@example.com',
        password: 'hash',
        role: 'user',
        roleId: null, // Missing
      };

      UserRepository.findByEmail.mockResolvedValue(legacyUser);
      bcrypt.compare.mockResolvedValue(true);
      UserRepository.createSession.mockResolvedValue({ id: 's1' });
      UserRepository.syncLegacyRole.mockResolvedValue(5); // Return new ID
      jwt.sign.mockReturnValue('token');

      await AuthService.login({
        email: 'old@example.com',
        password: 'pw',
        loginType: 'user',
      });

      expect(UserRepository.syncLegacyRole).toHaveBeenCalledWith(1, 'user');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser = { id: 2, email: 'new@example.com', role: 'user' };
      const mockSession = { id: 200 };

      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByUsername.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedpassword');
      UserRepository.create.mockResolvedValue(mockUser);
      UserRepository.createSession.mockResolvedValue(mockSession);
      jwt.sign.mockReturnValue('mock-token');

      const result = await AuthService.register({
        email: 'new@example.com',
        username: 'newuser',
        password: 'password',
        name: 'New',
        lastname: 'User',
      });

      expect(result).toHaveProperty('token', 'mock-token');
      expect(UserRepository.create).toHaveBeenCalled();
    });
  });
});
