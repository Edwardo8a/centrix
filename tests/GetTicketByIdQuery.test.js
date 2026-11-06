const GetTicketByIdQuery = require('../src/queries/tickets/GetTicketByIdQuery');
const GetTicketByIdHandler = require('../src/queries/tickets/GetTicketByIdHandler');
const UserRole = require('../src/enums/UserRole');

describe('GetTicketByIdQuery & GetTicketByIdHandler', () => {
  let mockTicketReadModel;
  let handler;

  const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
  const creatorId = '33333333-3333-4333-8333-333333333333';
  const assigneeId = '44444444-4444-4444-8444-444444444444';
  const gerenteId = '22222222-2222-4222-8222-222222222222';
  const adminId = '11111111-1111-4111-8111-111111111111';
  const deptId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const otroDeptId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const sampleTicket = {
    ticketId,
    title: 'Impresora sin conexión',
    description: 'Piso 2',
    priority: 'Alta',
    status: 'En progreso',
    departmentId: deptId,
    createdBy: creatorId,
    assignedTo: assigneeId,
    resolutionNotes: null,
    resolvedAtIso: null,
    createdAtIso: '2026-11-03T12:00:00Z',
    updatedAtIso: '2026-11-03T13:00:00Z',
    authorName: 'Saori',
    assignedToName: 'Carlos Soporte'
  };

  const sampleAttachments = [
    {
      id: 'att-1',
      fileFormat: 'png',
      sizeBytes: 245760,
      createdAtIso: '2026-11-03T12:05:00Z',
      signedUrl: 'https://placeholder.supabase.co/storage/v1/object/sign/ticket-attachments/captura.png?token=xyz'
    }
  ];

  beforeEach(() => {
    mockTicketReadModel = {
      getTicketById: jest.fn().mockResolvedValue(sampleTicket),
      getAttachmentsWithSignedUrls: jest.fn().mockResolvedValue(sampleAttachments)
    };
    handler = new GetTicketByIdHandler({ ticketReadModel: mockTicketReadModel });
  });

  it('debe crear un DTO inmutable GetTicketByIdQuery', () => {
    const query = new GetTicketByIdQuery({
      ticketId,
      userId: creatorId,
      userRole: UserRole.COLABORADOR,
      userDepartmentId: deptId
    });

    expect(Object.isFrozen(query)).toBe(true);
    expect(query.ticketId).toBe(ticketId);
  });

  it('debe devolver el detalle con evidencias firmadas para el colaborador creador', async () => {
    const query = new GetTicketByIdQuery({
      ticketId,
      userId: creatorId,
      userRole: UserRole.COLABORADOR,
      userDepartmentId: deptId
    });

    const result = await handler.handle(query);

    expect(mockTicketReadModel.getTicketById).toHaveBeenCalledWith(ticketId);
    expect(mockTicketReadModel.getAttachmentsWithSignedUrls).toHaveBeenCalledWith(ticketId);
    expect(result).toEqual({
      ...sampleTicket,
      attachments: sampleAttachments
    });
  });

  it('debe devolver el detalle con evidencias firmadas para soporte_tecnico asignado', async () => {
    const query = new GetTicketByIdQuery({
      ticketId,
      userId: assigneeId,
      userRole: UserRole.SOPORTE_TECNICO,
      userDepartmentId: deptId
    });

    const result = await handler.handle(query);
    expect(result.attachments).toEqual(sampleAttachments);
  });

  it('debe devolver el detalle con evidencias firmadas para gerente del departamento y administrador', async () => {
    const resGerente = await handler.handle(
      new GetTicketByIdQuery({
        ticketId,
        userId: gerenteId,
        userRole: UserRole.GERENTE,
        userDepartmentId: deptId
      })
    );
    expect(resGerente.ticketId).toBe(ticketId);

    const resAdmin = await handler.handle(
      new GetTicketByIdQuery({
        ticketId,
        userId: adminId,
        userRole: UserRole.ADMINISTRADOR,
        userDepartmentId: null
      })
    );
    expect(resAdmin.ticketId).toBe(ticketId);
  });

  it('debe lanzar BusinessError 404 si el ticket no existe y no firmar URLs', async () => {
    mockTicketReadModel.getTicketById.mockResolvedValue(null);

    await expect(
      handler.handle(
        new GetTicketByIdQuery({
          ticketId,
          userId: adminId,
          userRole: UserRole.ADMINISTRADOR
        })
      )
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Ticket no encontrado'
    });
    expect(mockTicketReadModel.getAttachmentsWithSignedUrls).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 403 y no firmar URLs si colaborador, soporte o gerente no tienen permiso', async () => {
    await expect(
      handler.handle(
        new GetTicketByIdQuery({
          ticketId,
          userId: 'otro-colab',
          userRole: UserRole.COLABORADOR,
          userDepartmentId: deptId
        })
      )
    ).rejects.toMatchObject({ statusCode: 403 });

    await expect(
      handler.handle(
        new GetTicketByIdQuery({
          ticketId,
          userId: 'otro-soporte',
          userRole: UserRole.SOPORTE_TECNICO,
          userDepartmentId: deptId
        })
      )
    ).rejects.toMatchObject({ statusCode: 403 });

    await expect(
      handler.handle(
        new GetTicketByIdQuery({
          ticketId,
          userId: gerenteId,
          userRole: UserRole.GERENTE,
          userDepartmentId: otroDeptId
        })
      )
    ).rejects.toMatchObject({ statusCode: 403 });

    await expect(
      handler.handle(
        new GetTicketByIdQuery({
          ticketId,
          userId: gerenteId,
          userRole: UserRole.GERENTE,
          userDepartmentId: null
        })
      )
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(mockTicketReadModel.getAttachmentsWithSignedUrls).not.toHaveBeenCalled();
  });
});

