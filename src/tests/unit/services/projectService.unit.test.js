import { jest } from '@jest/globals';

// 1. Mock dependencies
jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  prisma: {
    $transaction: jest.fn(async (callback) => {
      // simulate transaction by passing the mock prisma itself as the 'tx' client
      return await callback({
        project: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        projectsOnUsers: {
          findUnique: jest.fn(),
          createMany: jest.fn(),
          delete: jest.fn(),
          deleteMany: jest.fn(),
        },
        user: {
          count: jest.fn(),
        },
      });
    }),
  },
}));

jest.unstable_mockModule('../../../repositories/projectRepository.js', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteById: jest.fn(),
  addUsers: jest.fn(),
  removeUser: jest.fn(),
  removeAllUsers: jest.fn(),
  checkUsersExist: jest.fn(),
  getProjectUsers: jest.fn(),
  getProjectTasks: jest.fn(),
}));

// 2. Import modules
const ProjectService = await import('../../../services/projectService.js');
const ProjectRepository =
  await import('../../../repositories/projectRepository.js');
const { prisma } = await import('../../../lib/prisma.js');
const { AppError } = await import('../../../utils/AppError.js');

describe('ProjectService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('Debe crear un proyecto exitosamente', async () => {
      const data = { name: 'New Project', user_ids: [1, 2] };
      const creatorId = 10;
      const mockProject = { id: 1, name: 'New Project' };

      ProjectRepository.checkUsersExist.mockResolvedValue(true);
      ProjectRepository.create.mockResolvedValue(mockProject);
      ProjectRepository.addUsers.mockResolvedValue();

      const result = await ProjectService.createProject(data, creatorId);

      expect(result).toEqual(mockProject);
      expect(ProjectRepository.create).toHaveBeenCalledWith(
        data,
        creatorId,
        expect.anything(),
      );
      expect(ProjectRepository.addUsers).toHaveBeenCalled();
    });

    it('Debe lanzar error si algun usuario no existe', async () => {
      ProjectRepository.checkUsersExist.mockResolvedValue(false);

      await expect(
        ProjectService.createProject({ user_ids: [999] }, 10),
      ).rejects.toThrow(/One or more user_ids do not exist/);
    });
  });

  describe('updateProject (RBAC/IDOR)', () => {
    it('Debe permitir actualizar si el usuario es el creador', async () => {
      const project = { id: 1, creator_id: 10 };
      const user = { id: 10, role: 'user' };

      ProjectRepository.findById.mockResolvedValue(project);
      ProjectRepository.update.mockResolvedValue({
        ...project,
        name: 'Updated',
      });

      // Mocking transaction client behavior inside findUnique
      prisma.$transaction.mockImplementationOnce(async (cb) => {
        return await cb({
          projectsOnUsers: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          project: {
            findUnique: jest.fn().mockResolvedValue(project),
          },
        });
      });

      const result = await ProjectService.updateProject(
        1,
        { name: 'Updated' },
        user,
      );
      expect(result.name).toBe('Updated');
    });

    it('Debe rechazar si el usuario no tiene permisos', async () => {
      const project = { id: 1, creator_id: 10 };
      const user = { id: 99, role: 'user' }; // Not creator, not admin

      ProjectRepository.findById.mockResolvedValue(project);

      prisma.$transaction.mockImplementationOnce(async (cb) => {
        return await cb({
          projectsOnUsers: {
            findUnique: jest.fn().mockResolvedValue(null), // Not member
          },
        });
      });

      await expect(
        ProjectService.updateProject(1, { name: 'Hack' }, user),
      ).rejects.toThrow(/You do not have permission to update this project/);
    });
  });
});
