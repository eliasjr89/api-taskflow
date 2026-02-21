import { jest } from '@jest/globals';

// Mocks de dependencias
const mockUserRepo = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  assignTasks: jest.fn(),
  syncTasks: jest.fn(),
};

// Mock de bcryptjs
jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true),
  },
}));

// Mock de UserRepository
jest.unstable_mockModule(
  '../../../repositories/userRepository.js',
  () => mockUserRepo,
);

// Importamos el servicio DESPUÉS de los mocks
const { getUserById, createUser, updateUser } =
  await import('../../../services/userService.js');
const bcrypt = (await import('bcryptjs')).default;

describe('UserService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('Debe devolver un usuario si existe', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockUserRepo.findById.mockResolvedValue(mockUser);

      const result = await getUserById(1);
      expect(result).toEqual(mockUser);
      expect(mockUserRepo.findById).toHaveBeenCalledWith(1);
    });

    it('Debe lanzar error 404 si el usuario no existe', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(getUserById(999)).rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('Debe crear un usuario exitosamente', async () => {
      const userData = {
        username: 'new',
        email: 'new@test.com',
        password: '123',
      };
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.findByUsername.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({
        id: 10,
        ...userData,
        password: 'hashed_password',
      });

      const result = await createUser(userData);

      expect(result.id).toBe(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('123', 12);
      expect(mockUserRepo.create).toHaveBeenCalled();
    });

    it('Debe fallar si el email ya existe', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ id: 1 });
      await expect(createUser({ email: 'exists@test.com' })).rejects.toThrow(
        'Email already in use',
      );
    });
  });

  describe('updateUser', () => {
    it('Debe actualizar datos de perfil', async () => {
      const existingUser = { id: 1, email: 'old@test.com' };
      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.update.mockResolvedValue({
        ...existingUser,
        name: 'Updated',
      });

      const result = await updateUser(1, { name: 'Updated' });

      expect(result.name).toBe('Updated');
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, { name: 'Updated' });
    });
  });
});
