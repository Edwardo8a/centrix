const BudgetRepository = require('../src/repositories/BudgetRepository');

describe('BudgetRepository', () => {
  let mockSupabase;
  let repo;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          { id: '1', category: 'Equipo', estimated_amount: 1000, status: 'Aprobada', created_at: '2026-11-15T00:00:00Z' },
          { id: '2', category: 'Mobiliario', estimated_amount: 2000, status: 'Rechazada', created_at: '2026-11-16T00:00:00Z' }
        ],
        error: null
      }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      upsert: jest.fn().mockReturnThis()
    };
    repo = new BudgetRepository({ supabase: mockSupabase });
  });

  it('getKey genera la clave correcta por departamento, anio y mes', () => {
    expect(repo.getKey('dept-1', 2026, 11)).toBe('dept-1_2026_11');
  });

  it('getAllocations retorna valores por defecto cuando no hay registros', async () => {
    const allocations = await repo.getAllocations('dept-unique-brand-new', 2099, 1);
    expect(allocations).toBeDefined();
    expect(allocations.Equipo).toBe(5000000);
    expect(allocations.Mobiliario).toBe(3000000);
  });

  it('updateAllocations guarda en store y retorna asignaciones', async () => {
    const updated = await repo.updateAllocations('dept-write-test', 2026, 11, {
      Equipo: 7000000,
      Mobiliario: 4000000
    });
    expect(updated).toBeDefined();
    expect(updated.Equipo).toBe(7000000);
  });

  it('getDepartmentBudget calcula el presupuesto y los gastos por categoria', async () => {
    mockSupabase.is.mockResolvedValue({
      data: [
        { id: '1', category: 'Equipo', estimated_amount: 1000, status: 'Aprobada', created_at: '2026-11-15T00:00:00Z' },
        { id: '2', category: 'Equipo', estimated_amount: 500, status: 'Pendiente', created_at: '2026-11-16T00:00:00Z' }
      ],
      error: null
    });

    const budget = await repo.getDepartmentBudget('dept-calc-test', 2026, 11);
    expect(budget).toBeDefined();
    expect(budget.departmentId).toBe('dept-calc-test');
    expect(budget.totalSpentCents).toBe(100000);
    expect(budget.pendingCount).toBe(1);
    expect(budget.categories).toBeInstanceOf(Array);
  });

  it('getDepartmentReport calcula metricas y resumen de solicitudes', async () => {
    const report = await repo.getDepartmentReport('dept-report-test', 2026, 11);
    expect(report).toBeDefined();
    expect(report.totalRequests).toBe(2);
    expect(report.totalRequestedCents).toBe(300000);
    expect(report.totalApprovedCents).toBe(100000);
    expect(report.statusCounts.Aprobada).toBe(1);
    expect(report.statusCounts.Rechazada).toBe(1);
  });
});
