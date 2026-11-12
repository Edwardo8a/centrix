const DeleteResourceRequestHandler = require('../src/commands/resource-requests/DeleteResourceRequestHandler');
const DeleteResourceRequestCommand = require('../src/commands/resource-requests/DeleteResourceRequestCommand');
const BusinessError = require('../src/exceptions/BusinessError');

describe('DeleteResourceRequestHandler', () => {
  let mockResourceRequestRepository;
  let handler;

  const makeRequest = (overrides = {}) => ({
    id: 'rr-001',
    title: 'Silla ergonómica',
    status: 'Pendiente',
    department_id: 'dept-001',
    created_by: 'user-colaborador',
    deleted_at: null,
    ...overrides
  });

  beforeEach(() => {
    mockResourceRequestRepository = {
      findById: jest.fn(),
      softDelete: jest.fn().mockResolvedValue(undefined)
    };
    handler = new DeleteResourceRequestHandler({ resourceRequestRepository: mockResourceRequestRepository });
  });

  it('debe lanzar BusinessError 404 si la solicitud no existe', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(null);

    const command = new DeleteResourceRequestCommand({
      requestId: 'rr-inexistente',
      userId: 'user-admin',
      userRole: 'administrador',
      userDepartmentId: null
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 404 });
    expect(mockResourceRequestRepository.softDelete).not.toHaveBeenCalled();
  });

  it('un colaborador puede eliminar su propia solicitud en estado Pendiente', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest());

    const command = new DeleteResourceRequestCommand({
      requestId: 'rr-001',
      userId: 'user-colaborador',
      userRole: 'colaborador',
      userDepartmentId: 'dept-001'
    });

    const result = await handler.handle(command);

    expect(result).toEqual({ id: 'rr-001', deleted: true });
    expect(mockResourceRequestRepository.softDelete).toHaveBeenCalledWith('rr-001', 'user-colaborador');
  });

  it('un colaborador NO puede eliminar una solicitud que no está en estado Pendiente', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest({ status: 'Aprobada' }));

    const command = new DeleteResourceRequestCommand({
      requestId: 'rr-001',
      userId: 'user-colaborador',
      userRole: 'colaborador',
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 409 });
    expect(mockResourceRequestRepository.softDelete).not.toHaveBeenCalled();
  });

  it('un colaborador NO puede eliminar la solicitud de otro usuario', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest({ created_by: 'otro-user' }));

    const command = new DeleteResourceRequestCommand({
      requestId: 'rr-001',
      userId: 'user-colaborador',
      userRole: 'colaborador',
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 403 });
    expect(mockResourceRequestRepository.softDelete).not.toHaveBeenCalled();
  });

  it('un gerente puede eliminar solicitudes de su propio departamento', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest({ status: 'En proceso' }));

    const command = new DeleteResourceRequestCommand({
      requestId: 'rr-001',
      userId: 'user-gerente',
      userRole: 'gerente',
      userDepartmentId: 'dept-001'
    });

    const result = await handler.handle(command);

    expect(result).toEqual({ id: 'rr-001', deleted: true });
    expect(mockResourceRequestRepository.softDelete).toHaveBeenCalledWith('rr-001', 'user-gerente');
  });

  it('un gerente NO puede eliminar solicitudes de otro departamento', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest({ department_id: 'dept-otro' }));

    const command = new DeleteResourceRequestCommand({
      requestId: 'rr-001',
      userId: 'user-gerente',
      userRole: 'gerente',
      userDepartmentId: 'dept-001'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 403 });
    expect(mockResourceRequestRepository.softDelete).not.toHaveBeenCalled();
  });

  it('un gerente sin departamento asignado NO puede eliminar ninguna solicitud', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest());

    const command = new DeleteResourceRequestCommand({
      requestId: 'rr-001',
      userId: 'user-gerente',
      userRole: 'gerente',
      userDepartmentId: null
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({ statusCode: 403 });
    expect(mockResourceRequestRepository.softDelete).not.toHaveBeenCalled();
  });

  it('un administrador puede eliminar cualquier solicitud sin importar el estado', async () => {
    mockResourceRequestRepository.findById.mockResolvedValue(makeRequest({ status: 'Completada', department_id: 'dept-otro', created_by: 'otro-user' }));

    const command = new DeleteResourceRequestCommand({
      requestId: 'rr-001',
      userId: 'user-admin',
      userRole: 'administrador',
      userDepartmentId: null
    });

    const result = await handler.handle(command);

    expect(result).toEqual({ id: 'rr-001', deleted: true });
    expect(mockResourceRequestRepository.softDelete).toHaveBeenCalledWith('rr-001', 'user-admin');
  });
});
