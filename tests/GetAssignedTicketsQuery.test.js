const GetAssignedTicketsQuery = require('../src/queries/tickets/GetAssignedTicketsQuery');
const GetAssignedTicketsHandler = require('../src/queries/tickets/GetAssignedTicketsHandler');
const BusinessError = require('../src/exceptions/BusinessError');

describe('GetAssignedTicketsHandler', () => {
  let mockTicketReadModel;
  let handler;

  beforeEach(() => {
    mockTicketReadModel = {
      getTicketsByAssignee: jest.fn()
    };
    handler = new GetAssignedTicketsHandler({ ticketReadModel: mockTicketReadModel });
  });

  it('debe crear un DTO GetAssignedTicketsQuery inmutable', () => {
    const query = new GetAssignedTicketsQuery({ userId: 'tech-123' });

    expect(query.userId).toBe('tech-123');
    expect(Object.isFrozen(query)).toBe(true);
  });

  it('debe devolver únicamente los tickets asignados al usuario autenticado', async () => {
    const mockTickets = [
      {
        ticketId: 't-assigned-1',
        title: 'Ticket asignado',
        description: 'Detalle',
        priority: 'Alta',
        status: 'En revision',
        departmentId: 'dept-1',
        createdAtIso: '2026-11-03T12:00:00Z',
        authorName: 'Saori',
        assignedToName: 'Carlos Soporte'
      }
    ];
    mockTicketReadModel.getTicketsByAssignee.mockResolvedValue(mockTickets);

    const query = new GetAssignedTicketsQuery({ userId: 'tech-uuid' });
    const result = await handler.handle(query);

    expect(result).toEqual(mockTickets);
    expect(mockTicketReadModel.getTicketsByAssignee).toHaveBeenCalledTimes(1);
    expect(mockTicketReadModel.getTicketsByAssignee).toHaveBeenCalledWith('tech-uuid');
  });

  it('debe devolver [] cuando el usuario no tiene tickets asignados', async () => {
    mockTicketReadModel.getTicketsByAssignee.mockResolvedValue([]);

    const query = new GetAssignedTicketsQuery({ userId: 'tech-uuid' });
    const result = await handler.handle(query);

    expect(result).toEqual([]);
    expect(mockTicketReadModel.getTicketsByAssignee).toHaveBeenCalledWith('tech-uuid');
  });

  it('debe lanzar BusinessError 401 si falta userId', async () => {
    const query = new GetAssignedTicketsQuery({});

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({
      message: 'El usuario autenticado es obligatorio',
      statusCode: 401
    });
    expect(mockTicketReadModel.getTicketsByAssignee).not.toHaveBeenCalled();
  });
});

