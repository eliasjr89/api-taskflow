import { jest } from '@jest/globals';

// Define mocks
jest.unstable_mockModule('../../lib/prisma.js', () => ({
  prisma: {
    $transaction: jest.fn((callback) => callback({})), // Mock transaction to just execute callback
  },
}));

jest.unstable_mockModule('../../repositories/projectRepository.js', () => ({
  findById: jest.fn(),
  update: jest.fn(),
  checkUsersExist: jest.fn(),
  removeAllUsers: jest.fn(),
  addUsers: jest.fn(),
  getProjectUsers: jest.fn(),
  getProjectTasks: jest.fn(),
}));

describe('ProjectService', () => {
  let ProjectService;
  let ProjectRepository;

  beforeAll(async () => {
    ProjectService = await import('../projectService.js');
    ProjectRepository = await import('../../repositories/projectRepository.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProject', () => {
    it('should deny update if requestor is not creator', async () => {
      const mockProject = {
        id: 1,
        name: 'Old Name',
        creator_id: 100, // Creator is user 100
      };

      const updateData = {
        name: 'New Name',
      };

      // Request coming from User 999 (Attacker)
      // The current service function signature is updateProject(id, data)
      // It DOES NOT take the requesting userId, so it cannot enforce permission!

      ProjectRepository.findById.mockResolvedValue(mockProject);

      // We expect this to FAIL now with 403
      await expect(
        ProjectService.updateProject(1, updateData, 999),
      ).rejects.toThrow('You do not have permission to update this project');

      expect(ProjectRepository.update).not.toHaveBeenCalled();
    });
  });
});
