const GetResourceRequestByIdHandler = require('../src/queries/resource-requests/GetResourceRequestByIdHandler');
const GetResourceRequestByIdQuery = require('../src/queries/resource-requests/GetResourceRequestByIdQuery');
const BusinessError = require('../src/exceptions/BusinessError');

describe('GetResourceRequestByIdHandler', () => {
  let mockResourceRequestReadModel;
  let handler;

  const makeRequest = (overrides = {}) => ({
    id: 'rr-001',
    title: 'Silla ergonómica',
    status: 'Pendiente',
    departmentId: 'dept-001',
    createdBy: 'user-colaborador',
    ...overrides
  });

  beforeEach(() => {
    mockResourceRequestReadModel = {
      getRequestById: jest.fn()
    };
    handler = new GetResourceRequestByIdHandler({ resourceRequestReadModel: mockResourceRequestReadModel });
  });

  it('debe lanzar BusinessError 404 si la solicitud no existe', async () => {
    mockResourceRequestReadModel.getRequestById.mockResolvedValue(null);

    const query = new GetResourceRequestByIdQuery({
      requestId: 'rr-inexistente',
      userId: 'user-admin',
      userRole: 'administrador',
      userDepartmentId: null
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('un administrador puede consultar cualquier solicitud', async () => {
    const request = makeRequest({ departmentId: 'dept-otro', createdBy: 'otro-user' });
    mockResourceRequestReadModel.getRequestById.mockResolvedValue(request);

    const query = new GetResourceRequestByIdQuery({
      requestId: 'rr-001',
      userId: 'user-admin',
      userRole: 'administrador',
      userDepartmentId: null
    });

    const result = await handler.handle(query);
    expect(result).toEqual(request);
  });

  it('un gerente puede consultar solicitudes de su propio departamento', async () => {
    const request = makeRequest({ departmentId: 'dept-001' });
    mockResourceRequestReadModel.getRequestById.mockResolvedValue(request);

    const query = new GetResourceRequestByIdQuery({
      requestId: 'rr-001',
      userId: 'user-gerente',
      userRole: 'gerente',
      userDepartmentId: 'dept-001'
    });

    const result = await handler.handle(query);
    expect(result).toEqual(request);
  });

  it('un gerente NO puede consultar solicitudes de otro departamento', async () => {
    mockResourceRequestReadModel.getRequestById.mockResolvedValue(makeRequest({ departmentId: 'dept-otro' }));

    const query = new GetResourceRequestByIdQuery({
      requestId: 'rr-001',
      userId: 'user-gerente',
      userRole: 'gerente',
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('un gerente sin departamento asignado lanza BusinessError 403', async () => {
    mockResourceRequestReadModel.getRequestById.mockResolvedValue(makeRequest());

    const query = new GetResourceRequestByIdQuery({
      requestId: 'rr-001',
      userId: 'user-gerente',
      userRole: 'gerente',
      userDepartmentId: null
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('un colaborador puede consultar su propia solicitud', async () => {
    const request = makeRequest({ createdBy: 'user-colaborador' });
    mockResourceRequestReadModel.getRequestById.mockResolvedValue(request);

    const query = new GetResourceRequestByIdQuery({
      requestId: 'rr-001',
      userId: 'user-colaborador',
      userRole: 'colaborador',
      userDepartmentId: 'dept-001'
    });

    const result = await handler.handle(query);
    expect(result).toEqual(request);
  });

  it('un colaborador NO puede consultar la solicitud de otro usuario', async () => {
    mockResourceRequestReadModel.getRequestById.mockResolvedValue(makeRequest({ createdBy: 'otro-user' }));

    const query = new GetResourceRequestByIdQuery({
      requestId: 'rr-001',
      userId: 'user-colaborador',
      userRole: 'colaborador',
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({ statusCode: 403 });
  });
});
