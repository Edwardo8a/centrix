const GetResourceRequestsByDepartmentHandler = require('../src/queries/resource-requests/GetResourceRequestsByDepartmentHandler');
const GetResourceRequestsByDepartmentQuery = require('../src/queries/resource-requests/GetResourceRequestsByDepartmentQuery');
const BusinessError = require('../src/exceptions/BusinessError');

describe('GetResourceRequestsByDepartmentHandler', () => {
  let mockResourceRequestReadModel;
  let handler;

  const mockData = {
    data: [{ id: 'rr-001', title: 'Silla', status: 'Pendiente' }],
    total: 1,
    page: 1,
    limit: 20
  };

  beforeEach(() => {
    mockResourceRequestReadModel = {
      getRequestsByDepartment: jest.fn().mockResolvedValue(mockData)
    };
    handler = new GetResourceRequestsByDepartmentHandler({ resourceRequestReadModel: mockResourceRequestReadModel });
  });

  // --- GERENTE ---

  it('un gerente puede consultar solicitudes de su propio departamento', async () => {
    const query = new GetResourceRequestsByDepartmentQuery({
      userId: 'user-gerente',
      userRole: 'gerente',
      userDepartmentId: 'dept-001',
      departmentId: null,
      page: 1,
      limit: 20
    });

    const result = await handler.handle(query);

    expect(result).toEqual(mockData);
    expect(mockResourceRequestReadModel.getRequestsByDepartment).toHaveBeenCalledWith('dept-001', {
      status: null,
      page: 1,
      limit: 20
    });
  });

  it('un gerente NO puede consultar solicitudes de otro departamento', async () => {
    const query = new GetResourceRequestsByDepartmentQuery({
      userId: 'user-gerente',
      userRole: 'gerente',
      userDepartmentId: 'dept-001',
      departmentId: 'dept-otro',
      page: 1,
      limit: 20
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 403 });
    expect(mockResourceRequestReadModel.getRequestsByDepartment).not.toHaveBeenCalled();
  });

  it('un gerente sin departamento asignado lanza BusinessError 403', async () => {
    const query = new GetResourceRequestsByDepartmentQuery({
      userId: 'user-gerente',
      userRole: 'gerente',
      userDepartmentId: null,
      departmentId: null,
      page: 1,
      limit: 20
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 403 });
  });

  // --- ADMINISTRADOR ---

  it('un administrador puede consultar por departmentId explícito', async () => {
    const query = new GetResourceRequestsByDepartmentQuery({
      userId: 'user-admin',
      userRole: 'administrador',
      userDepartmentId: null,
      departmentId: 'dept-002',
      page: 1,
      limit: 10
    });

    const result = await handler.handle(query);

    expect(result).toEqual(mockData);
    expect(mockResourceRequestReadModel.getRequestsByDepartment).toHaveBeenCalledWith('dept-002', {
      status: null,
      page: 1,
      limit: 10
    });
  });

  it('un administrador sin departmentId explícito lanza BusinessError 400', async () => {
    const query = new GetResourceRequestsByDepartmentQuery({
      userId: 'user-admin',
      userRole: 'administrador',
      userDepartmentId: null,
      departmentId: null,
      page: 1,
      limit: 20
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 400 });
  });

  // --- COLABORADOR (no permitido) ---

  it('un colaborador lanza BusinessError 403 al intentar consultar por departamento', async () => {
    const query = new GetResourceRequestsByDepartmentQuery({
      userId: 'user-colab',
      userRole: 'colaborador',
      userDepartmentId: 'dept-001',
      departmentId: null,
      page: 1,
      limit: 20
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 403 });
  });

  // --- PAGINACIÓN ---

  it('debe lanzar BusinessError 400 si page < 1', async () => {
    const query = new GetResourceRequestsByDepartmentQuery({
      userId: 'user-admin',
      userRole: 'administrador',
      userDepartmentId: null,
      departmentId: 'dept-001',
      page: 0,
      limit: 20
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('debe lanzar BusinessError 400 si limit > 100', async () => {
    const query = new GetResourceRequestsByDepartmentQuery({
      userId: 'user-admin',
      userRole: 'administrador',
      userDepartmentId: null,
      departmentId: 'dept-001',
      page: 1,
      limit: 150
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 400 });
  });

  // --- FILTRO POR STATUS ---

  it('debe pasar el status normalizado al readModel cuando se proporciona', async () => {
    const query = new GetResourceRequestsByDepartmentQuery({
      userId: 'user-admin',
      userRole: 'administrador',
      userDepartmentId: null,
      departmentId: 'dept-001',
      status: 'pendiente',
      page: 1,
      limit: 20
    });

    await handler.handle(query);

    expect(mockResourceRequestReadModel.getRequestsByDepartment).toHaveBeenCalledWith('dept-001', {
      status: 'Pendiente',
      page: 1,
      limit: 20
    });
  });
});
