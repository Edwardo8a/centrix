const GetDepartmentReportHandler = require('../src/queries/resource-requests/GetDepartmentReportHandler');
const GetDepartmentReportQuery = require('../src/queries/resource-requests/GetDepartmentReportQuery');
const UserRole = require('../src/enums/UserRole');

describe('GetDepartmentReportHandler', () => {
  let mockBudgetRepository;
  let handler;

  beforeEach(() => {
    mockBudgetRepository = {
      getDepartmentReport: jest.fn().mockResolvedValue({
        summary: { totalRequests: 5, approved: 3, rejected: 1, pending: 1 }
      })
    };
    handler = new GetDepartmentReportHandler({ budgetRepository: mockBudgetRepository });
  });

  it('debe lanzar BusinessError 403 si el rol no tiene permisos para otro departamento', async () => {
    const query = new GetDepartmentReportQuery({
      departmentId: 'dept-otro',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('un gerente puede consultar reportes de su departamento', async () => {
    const query = new GetDepartmentReportQuery({
      departmentId: 'dept-001',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    const result = await handler.handle(query);
    expect(result).toBeDefined();
    expect(mockBudgetRepository.getDepartmentReport).toHaveBeenCalled();
  });

  it('un administrador puede consultar reportes de cualquier departamento', async () => {
    const query = new GetDepartmentReportQuery({
      departmentId: 'dept-002',
      userRole: UserRole.ADMINISTRADOR,
      userDepartmentId: null
    });

    const result = await handler.handle(query);
    expect(result).toBeDefined();
    expect(mockBudgetRepository.getDepartmentReport).toHaveBeenCalled();
  });
});
