const GetDepartmentBudgetHandler = require('../src/queries/resource-requests/GetDepartmentBudgetHandler');
const GetDepartmentBudgetQuery = require('../src/queries/resource-requests/GetDepartmentBudgetQuery');
const UserRole = require('../src/enums/UserRole');

describe('GetDepartmentBudgetHandler', () => {
  let mockBudgetRepository;
  let handler;

  beforeEach(() => {
    mockBudgetRepository = {
      getDepartmentBudget: jest.fn().mockResolvedValue({
        totalBudgetCents: 15000000,
        totalSpentCents: 500000,
        availableCents: 14500000
      })
    };
    handler = new GetDepartmentBudgetHandler({ budgetRepository: mockBudgetRepository });
  });

  it('debe lanzar BusinessError 403 si el rol no tiene permisos para otro departamento', async () => {
    const query = new GetDepartmentBudgetQuery({
      departmentId: 'dept-otro',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('un gerente puede consultar el presupuesto de su departamento', async () => {
    const query = new GetDepartmentBudgetQuery({
      departmentId: 'dept-001',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    const result = await handler.handle(query);
    expect(result).toBeDefined();
    expect(mockBudgetRepository.getDepartmentBudget).toHaveBeenCalled();
  });

  it('un administrador puede consultar el presupuesto de cualquier departamento', async () => {
    const query = new GetDepartmentBudgetQuery({
      departmentId: 'dept-002',
      userRole: UserRole.ADMINISTRADOR,
      userDepartmentId: null
    });

    const result = await handler.handle(query);
    expect(result).toBeDefined();
    expect(mockBudgetRepository.getDepartmentBudget).toHaveBeenCalled();
  });
});
