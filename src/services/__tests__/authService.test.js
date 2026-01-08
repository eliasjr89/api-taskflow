import { jest } from '@jest/globals';

// Define mocks before importing service
jest.unstable_mockModule('../../repositories/userRepository.js', () => ({
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  createSession: jest.fn(),
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
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        username: 'testuser',
      };

      const mockSession = {
        id: 100,
      };

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

      // Verify session was passed to token
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 100 }),
        expect.any(String),
        expect.any(Object),
      );
    });
  });

  describe('register', () => {
    it('should register successfully but might be missing session', async () => {
      const mockUser = {
        id: 2,
        email: 'new@example.com',
        role: 'user',
        password: 'hashedpassword',
      };

      const mockSession = {
        id: 200,
      };

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
        ipAddress: '127.0.0.1',
        userAgent: 'Jest',
      });

      expect(result).toHaveProperty('token', 'mock-token');
      expect(UserRepository.create).toHaveBeenCalled();
      expect(UserRepository.createSession).toHaveBeenCalled();

      // Verify session was passed to token
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2,
          role: 'user',
          sessionId: expect.anything(),
        }),
        expect.any(String),
        expect.any(Object),
      );
    });
  });
});
