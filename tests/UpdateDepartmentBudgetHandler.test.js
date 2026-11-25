const UpdateDepartmentBudgetHandler = require('../src/commands/resource-requests/UpdateDepartmentBudgetHandler');
const UpdateDepartmentBudgetCommand = require('../src/commands/resource-requests/UpdateDepartmentBudgetCommand');
const UserRole = require('../src/enums/UserRole');

describe('UpdateDepartmentBudgetHandler', () => {
  let mockBudgetRepository;
  let handler;

  beforeEach(() => {
    mockBudgetRepository = {
      getDepartmentBudget: jest.fn().mockResolvedValue({
        categories: [
          { category: 'Equipo', spentCents: 1000 }
        ]
      }),
      updateAllocations: jest.fn().mockResolvedValue({
        Equipo: 5000000,
        Mobiliario: 3000000
      })
    };
    handler = new UpdateDepartmentBudgetHandler({ budgetRepository: mockBudgetRepository });
  });

  it('debe lanzar BusinessError 403 si el rol no es gerente ni administrador', async () => {
    const command = new UpdateDepartmentBudgetCommand({
      departmentId: 'dept-001',
      allocations: { Equipo: 5000000 },
      userId: 'user-colaborador',
      userRole: UserRole.COLABORADOR,
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('debe lanzar BusinessError 403 si un gerente intenta modificar otro departamento', async () => {
    const command = new UpdateDepartmentBudgetCommand({
      departmentId: 'dept-otro',
      allocations: { Equipo: 5000000 },
      userId: 'user-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('un gerente puede actualizar el presupuesto de su departamento', async () => {
    const command = new UpdateDepartmentBudgetCommand({
      departmentId: 'dept-001',
      allocations: { Equipo: 6000000 },
      year: 2026,
      month: 11,
      userId: 'user-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    const result = await handler.handle(command);
    expect(result).toBeDefined();
    expect(mockBudgetRepository.updateAllocations).toHaveBeenCalled();
  });

  it('un administrador puede actualizar el presupuesto especificando departmentId', async () => {
    const command = new UpdateDepartmentBudgetCommand({
      departmentId: 'dept-002',
      allocations: { Equipo: 8000000 },
      year: 2026,
      month: 11,
      userId: 'user-admin',
      userRole: UserRole.ADMINISTRADOR,
      userDepartmentId: null
    });

    const result = await handler.handle(command);
    expect(result).toBeDefined();
    expect(mockBudgetRepository.updateAllocations).toHaveBeenCalled();
  });
});
