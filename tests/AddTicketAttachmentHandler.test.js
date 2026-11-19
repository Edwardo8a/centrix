const AddTicketAttachmentCommand = require('../src/commands/tickets/AddTicketAttachmentCommand');
const AddTicketAttachmentHandler = require('../src/commands/tickets/AddTicketAttachmentHandler');
const UserRole = require('../src/enums/UserRole');
const BusinessError = require('../src/exceptions/BusinessError');

describe('AddTicketAttachmentCommand & AddTicketAttachmentHandler', () => {
  let mockTicketRepository;
  let handler;

  const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
  const creatorId = '33333333-3333-4333-8333-333333333333';
  const otherUserId = '55555555-5555-4555-8555-555555555555';
  const gerenteId = '22222222-2222-4222-8222-222222222222';
  const adminId = '11111111-1111-4111-8111-111111111111';
  const deptId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const otroDeptId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  beforeEach(() => {
    mockTicketRepository = {
      findById: jest.fn(),
      addAttachment: jest.fn()
    };

    handler = new AddTicketAttachmentHandler({
      ticketRepository: mockTicketRepository,
      bucketName: 'ticket-attachments',
      supabaseUrl: 'https://placeholder.supabase.co'
    });
  });

  it('debe crear un DTO inmutable AddTicketAttachmentCommand', () => {
    const command = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/evidencia.png`,
      fileFormat: 'png',
      sizeBytes: 204800,
      userId: creatorId,
      userRole: UserRole.COLABORADOR,
      userDepartmentId: deptId
    });

    expect(Object.isFrozen(command)).toBe(true);
    expect(command.ticketId).toBe(ticketId);
  });

  it('debe permitir al creador del ticket (colaborador) adjuntar evidencia válida', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      created_by: creatorId,
      department_id: deptId
    });
    mockTicketRepository.addAttachment.mockResolvedValue({ id: 'att-1' });

    const command = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/captura.png`,
      fileFormat: 'image/png',
      sizeBytes: 102400,
      userId: creatorId,
      userRole: UserRole.COLABORADOR,
      userDepartmentId: deptId
    });

    const result = await handler.handle(command);

    expect(mockTicketRepository.addAttachment).toHaveBeenCalledWith({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/captura.png`,
      fileFormat: 'png',
      sizeBytes: 102400
    });
    expect(result).toEqual({ id: 'att-1' });
  });

  it('debe permitir al gerente del mismo departamento adjuntar evidencia aunque no sea el creador', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      created_by: creatorId,
      department_id: deptId
    });
    mockTicketRepository.addAttachment.mockResolvedValue({ id: 'att-2' });

    const command = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `https://placeholder.supabase.co/storage/v1/object/authenticated/ticket-attachments/${ticketId}/reporte.pdf`,
      fileFormat: '.PDF',
      sizeBytes: 512000,
      userId: gerenteId,
      userRole: UserRole.GERENTE,
      userDepartmentId: deptId
    });

    const result = await handler.handle(command);

    expect(mockTicketRepository.addAttachment).toHaveBeenCalledWith({
      ticketId,
      fileUrl: `https://placeholder.supabase.co/storage/v1/object/authenticated/ticket-attachments/${ticketId}/reporte.pdf`,
      fileFormat: 'pdf',
      sizeBytes: 512000
    });
    expect(result).toEqual({ id: 'att-2' });
  });

  it('debe permitir al administrador adjuntar evidencia a cualquier ticket', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      created_by: creatorId,
      department_id: otroDeptId
    });
    mockTicketRepository.addAttachment.mockResolvedValue({ id: 'att-3' });

    const command = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/auditoria.jpg`,
      fileFormat: 'jpg',
      sizeBytes: 150000,
      userId: adminId,
      userRole: UserRole.ADMINISTRADOR,
      userDepartmentId: null
    });

    const result = await handler.handle(command);

    expect(result).toEqual({ id: 'att-3' });
  });

  it('debe lanzar BusinessError 404 si el ticket no existe o está eliminado', async () => {
    mockTicketRepository.findById.mockResolvedValue(null);

    const command = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/foto.png`,
      fileFormat: 'png',
      sizeBytes: 1000,
      userId: creatorId,
      userRole: UserRole.COLABORADOR
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Ticket no encontrado'
    });
  });

  it('debe lanzar BusinessError 403 si un colaborador intenta adjuntar a un ticket ajeno', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      created_by: creatorId,
      department_id: deptId
    });

    const command = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/foto.png`,
      fileFormat: 'png',
      sizeBytes: 1000,
      userId: otherUserId,
      userRole: UserRole.COLABORADOR,
      userDepartmentId: deptId
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      statusCode: 403,
      message: 'No tienes permiso para adjuntar evidencias a un ticket que no creaste'
    });
  });

  it('debe lanzar BusinessError 403 si un gerente sin departamento o de otro departamento intenta adjuntar', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      created_by: creatorId,
      department_id: deptId
    });

    const cmdSinDepto = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/foto.png`,
      fileFormat: 'png',
      sizeBytes: 1000,
      userId: gerenteId,
      userRole: UserRole.GERENTE,
      userDepartmentId: null
    });

    await expect(handler.handle(cmdSinDepto)).rejects.toMatchObject({
      statusCode: 403,
      message: 'El gerente no tiene un departamento asignado'
    });

    const cmdOtroDepto = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/foto.png`,
      fileFormat: 'png',
      sizeBytes: 1000,
      userId: gerenteId,
      userRole: UserRole.GERENTE,
      userDepartmentId: otroDeptId
    });

    await expect(handler.handle(cmdOtroDepto)).rejects.toMatchObject({
      statusCode: 403,
      message: 'No tienes permiso para adjuntar evidencias a un ticket de otro departamento'
    });
  });

  it('debe lanzar BusinessError 400 si el formato no está permitido (ej. exe, zip)', async () => {
    const command = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/malware.exe`,
      fileFormat: 'exe',
      sizeBytes: 1000,
      userId: creatorId,
      userRole: UserRole.COLABORADOR
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Formato de archivo no permitido. Formatos válidos: jpg, jpeg, png, webp, pdf'
    });
    expect(mockTicketRepository.findById).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 400 si size_bytes es <= 0 o excede 5 MB', async () => {
    const cmdZero = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/foto.png`,
      fileFormat: 'png',
      sizeBytes: 0,
      userId: creatorId,
      userRole: UserRole.COLABORADOR
    });
    await expect(handler.handle(cmdZero)).rejects.toMatchObject({ statusCode: 400 });

    const cmdTooBig = new AddTicketAttachmentCommand({
      ticketId,
      fileUrl: `ticket-attachments/${ticketId}/foto.png`,
      fileFormat: 'png',
      sizeBytes: 5 * 1024 * 1024 + 1,
      userId: creatorId,
      userRole: UserRole.COLABORADOR
    });
    await expect(handler.handle(cmdTooBig)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('debe lanzar BusinessError 400 si file_url apunta a otro dominio, otro bucket o usa path traversal', async () => {
    const invalidUrls = [
      'https://evil.example.com/storage/v1/object/ticket-attachments/foto.png',
      'otro-bucket/325cc46a/foto.png',
      'ticket-attachments/../secrets/foto.png',
      'ticket-attachments/'
    ];

    for (const badUrl of invalidUrls) {
      const cmd = new AddTicketAttachmentCommand({
        ticketId,
        fileUrl: badUrl,
        fileFormat: 'png',
        sizeBytes: 1024,
        userId: creatorId,
        userRole: UserRole.COLABORADOR
      });
      await expect(handler.handle(cmd)).rejects.toMatchObject({
        statusCode: 400,
        message: 'La ruta file_url no pertenece al bucket de evidencias configurado'
      });
    }
  });
});

