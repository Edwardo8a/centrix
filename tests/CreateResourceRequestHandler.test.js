const CreateResourceRequestHandler = require('../src/commands/resource-requests/CreateResourceRequestHandler');
const CreateResourceRequestCommand = require('../src/commands/resource-requests/CreateResourceRequestCommand');
const BusinessError = require('../src/exceptions/BusinessError');

describe('CreateResourceRequestHandler', () => {
  let mockResourceRequestRepository;
  let handler;

  beforeEach(() => {
    mockResourceRequestRepository = {
      create: jest.fn()
    };
    handler = new CreateResourceRequestHandler({ resourceRequestRepository: mockResourceRequestRepository });
  });

  it('debe crear una solicitud correctamente y retornar el id', async () => {
    mockResourceRequestRepository.create.mockResolvedValue({ id: 'rr-001' });

    const command = new CreateResourceRequestCommand({
      title: 'Solicitud de silla ergonómica',
      description: 'Se requiere una silla ergonómica para el puesto de trabajo',
      category: 'Mobiliario',
      estimatedAmount: 2500,
      departmentId: 'dept-001',
      userId: 'user-001'
    });

    const result = await handler.handle(command);

    expect(result).toEqual({ id: 'rr-001' });
    expect(mockResourceRequestRepository.create).toHaveBeenCalledTimes(1);

    const savedRequest = mockResourceRequestRepository.create.mock.calls[0][0];
    expect(savedRequest.title).toBe('Solicitud de silla ergonómica');
    expect(savedRequest.category).toBe('Mobiliario');
    expect(savedRequest.status).toBe('Pendiente');
    expect(savedRequest.estimated_amount).toBe(2500);
  });

  it('debe lanzar BusinessError y no llamar al repositorio si falta el título', async () => {
    const command = new CreateResourceRequestCommand({
      title: '',
      description: 'Descripción válida',
      category: 'Material',
      departmentId: 'dept-001',
      userId: 'user-001'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    expect(mockResourceRequestRepository.create).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError si la categoría es inválida', async () => {
    const command = new CreateResourceRequestCommand({
      title: 'Título válido',
      description: 'Descripción válida',
      category: 'CategoriaInventada',
      departmentId: 'dept-001',
      userId: 'user-001'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    expect(mockResourceRequestRepository.create).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError si falta el departamento', async () => {
    const command = new CreateResourceRequestCommand({
      title: 'Título válido',
      description: 'Descripción válida',
      category: 'Material',
      departmentId: null,
      userId: 'user-001'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    expect(mockResourceRequestRepository.create).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError si falta el userId (solicitante)', async () => {
    const command = new CreateResourceRequestCommand({
      title: 'Título válido',
      description: 'Descripción válida',
      category: 'Papeleria',
      departmentId: 'dept-001',
      userId: null
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    expect(mockResourceRequestRepository.create).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError si el monto estimado es negativo', async () => {
    const command = new CreateResourceRequestCommand({
      title: 'Título válido',
      description: 'Descripción válida',
      category: 'Economico',
      estimatedAmount: -100,
      departmentId: 'dept-001',
      userId: 'user-001'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    expect(mockResourceRequestRepository.create).not.toHaveBeenCalled();
  });

  it('debe permitir monto estimado igual a cero', async () => {
    mockResourceRequestRepository.create.mockResolvedValue({ id: 'rr-002' });

    const command = new CreateResourceRequestCommand({
      title: 'Resmas de papel',
      description: 'Se requieren 10 resmas de papel bond',
      category: 'Papeleria',
      estimatedAmount: 0,
      departmentId: 'dept-001',
      userId: 'user-001'
    });

    const result = await handler.handle(command);
    expect(result).toEqual({ id: 'rr-002' });

    const savedRequest = mockResourceRequestRepository.create.mock.calls[0][0];
    expect(savedRequest.estimated_amount).toBe(0);
  });

  it('debe permitir crear sin monto estimado (null)', async () => {
    mockResourceRequestRepository.create.mockResolvedValue({ id: 'rr-003' });

    const command = new CreateResourceRequestCommand({
      title: 'Escritorio de trabajo',
      description: 'Se requiere un escritorio para área de ventas',
      category: 'Mobiliario',
      estimatedAmount: null,
      departmentId: 'dept-001',
      userId: 'user-001'
    });

    const result = await handler.handle(command);
    expect(result).toEqual({ id: 'rr-003' });

    const savedRequest = mockResourceRequestRepository.create.mock.calls[0][0];
    expect(savedRequest.estimated_amount).toBeNull();
  });
});
