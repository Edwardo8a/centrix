const DecideResourceRequestHandler = require('../src/commands/resource-requests/DecideResourceRequestHandler');
const DecideResourceRequestCommand = require('../src/commands/resource-requests/DecideResourceRequestCommand');
const UserRole = require('../src/enums/UserRole');

describe('DecideResourceRequestHandler', () => {
  let mockResourceRequestRepository;
  let mockBudgetRepository;
  let handler;

  const makeRequest = (overrides = {}) => ({
    id: 'rr-001',
    title: 'Monitor 4K',
    category: 'Equipo',
    estimated_amount: 5000,
    status: 'Pendiente',
    department_id: 'dept-001',
    created_by: 'user-001',
    created_at: '2026-11-15T00:00:00Z',
    ...overrides
  });

  beforeEach(() => {
    mockResourceRequestRepository = {
      findById: jest.fn(),
      updateDecision: jest.fn().mockResolvedValue({ id: 'rr-001', status: 'Aprobada' })
    };
    mockBudgetRepository = {
      getDepartmentBudget: jest.fn().mockResolvedValue({
        categories: [
          { category: 'Equipo', availableCents: 1000000 }
        ]
      })
    };
    handler = new DecideResourceRequestHandler({
      resourceRequestRepository: mockResourceRequestRepository,
      budgetRepository: mockBudgetRepository
    });
  });

  it('debe lanzar BusinessError 404 si la solicitud no existe', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(null);

    const command = new DecideResourceRequestCommand({
      requestId: 'rr-inexistente',
      decision: 'Aprobada',
      userId: 'user-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('debe lanzar BusinessError 403 si el rol no es gerente ni administrador', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest());

    const command = new DecideResourceRequestCommand({
      requestId: 'rr-001',
      decision: 'Aprobada',
      userId: 'user-colaborador',
      userRole: UserRole.COLABORADOR,
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('debe lanzar BusinessError 403 si un gerente intenta decidir sobre otro departamento', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest({ department_id: 'dept-otro' }));

    const command = new DecideResourceRequestCommand({
      requestId: 'rr-001',
      decision: 'Aprobada',
      userId: 'user-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('debe lanzar BusinessError 409 si la solicitud no esta en estado Pendiente', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest({ status: 'Aprobada' }));

    const command = new DecideResourceRequestCommand({
      requestId: 'rr-001',
      decision: 'Aprobada',
      userId: 'user-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('debe lanzar BusinessError 400 si se rechaza sin motivo', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest());

    const command = new DecideResourceRequestCommand({
      requestId: 'rr-001',
      decision: 'Rechazada',
      comment: '',
      userId: 'user-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('debe lanzar BusinessError 400 si el presupuesto disponible es insuficiente', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest({ estimated_amount: 15000 }));
    mockBudgetRepository.getDepartmentBudget.mockResolvedValue({
      categories: [
        { category: 'Equipo', availableCents: 500000 }
      ]
    });

    const command = new DecideResourceRequestCommand({
      requestId: 'rr-001',
      decision: 'Aprobada',
      userId: 'user-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('un gerente puede aprobar una solicitud con presupuesto suficiente', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest());

    const command = new DecideResourceRequestCommand({
      requestId: 'rr-001',
      decision: 'Aprobada',
      userId: 'user-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-001'
    });

    const result = await handler.handle(command);
    expect(result).toBeDefined();
    expect(mockResourceRequestRepository.updateDecision).toHaveBeenCalledWith('rr-001', {
      status: 'Aprobada',
      rejectionReason: null,
      reviewedBy: 'user-gerente'
    });
  });

  it('un administrador puede rechazar una solicitud con motivo', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest());
    mockResourceRequestRepository.updateDecision.mockResolvedValue({ id: 'rr-001', status: 'Rechazada' });

    const command = new DecideResourceRequestCommand({
      requestId: 'rr-001',
      decision: 'Rechazada',
      comment: 'Fuera de presupuesto proyectado',
      userId: 'user-admin',
      userRole: UserRole.ADMINISTRADOR,
      userDepartmentId: null
    });

    const result = await handler.handle(command);
    expect(result).toBeDefined();
    expect(mockResourceRequestRepository.updateDecision).toHaveBeenCalledWith('rr-001', {
      status: 'Rechazada',
      rejectionReason: 'Fuera de presupuesto proyectado',
      reviewedBy: 'user-admin'
    });
  });
});
