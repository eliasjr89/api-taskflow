import { jest } from '@jest/globals';

// Mocks
const mockTaskRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteSoft: jest.fn(),
  checkProjectExists: jest.fn(),
  checkStatusExists: jest.fn(),
  addUsers: jest.fn(),
  removeAllUsers: jest.fn(),
};

const mockPrisma = {
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

const mockWebhook = {
  trigger: jest.fn().mockResolvedValue(true),
};

// Configurar Mocks de Módulos
jest.unstable_mockModule('../../../lib/prisma.js', () => ({
  prisma: mockPrisma,
}));
jest.unstable_mockModule(
  '../../../repositories/taskRepository.js',
  () => mockTaskRepo,
);
jest.unstable_mockModule(
  '../../../services/webhookService.js',
  () => mockWebhook,
);

const { getAllTasks, createTask, updateTask } =
  await import('../../../services/taskService.js');

describe('TaskService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTasks', () => {
    it('Debe devolver tareas paginadas', async () => {
      mockTaskRepo.findAll.mockResolvedValue({ tasks: [{ id: 1 }], total: 1 });

      const result = await getAllTasks({ page: 1, limit: 10 });

      expect(result.results).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(mockTaskRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 }),
      );
    });
  });

  describe('createTask', () => {
    it('Debe crear una tarea dentro de una transacción', async () => {
      const taskData = { description: 'Test', project_id: 1 };
      mockTaskRepo.checkProjectExists.mockResolvedValue(true);
      mockTaskRepo.create.mockResolvedValue({ id: 100 });
      mockTaskRepo.findById.mockResolvedValue({ id: 100, description: 'Test' });

      const result = await createTask(taskData);

      expect(result.id).toBe(100);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockWebhook.trigger).toHaveBeenCalledWith(
        'task.created',
        expect.any(Object),
      );
    });

    it('Debe fallar si el proyecto no existe', async () => {
      mockTaskRepo.checkProjectExists.mockResolvedValue(false);
      await expect(createTask({ project_id: 999 })).rejects.toThrow(
        'Project not found',
      );
    });
  });
});
