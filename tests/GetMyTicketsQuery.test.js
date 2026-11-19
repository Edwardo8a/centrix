const GetMyTicketsQuery = require('../src/queries/tickets/GetMyTicketsQuery');
const GetMyTicketsHandler = require('../src/queries/tickets/GetMyTicketsHandler');
const BusinessError = require('../src/exceptions/BusinessError');

describe('GetMyTicketsHandler', () => {
  let mockTicketReadModel;
  let handler;

  beforeEach(() => {
    mockTicketReadModel = {
      getTicketsByCreator: jest.fn()
    };
    handler = new GetMyTicketsHandler({ ticketReadModel: mockTicketReadModel });
  });

  it('debe crear un DTO GetMyTicketsQuery inmutable', () => {
    const query = new GetMyTicketsQuery({ userId: 'user-123' });

    expect(query.userId).toBe('user-123');
    expect(Object.isFrozen(query)).toBe(true);
  });

  it('debe devolver únicamente los tickets del usuario solicitante', async () => {
    const mockTickets = [
      {
        ticketId: 't-1',
        title: 'Mi ticket 1',
        description: 'Detalle 1',
        priority: 'Media',
        status: 'Abierto',
        departmentId: 'dept-1',
        createdAtIso: '2026-11-03T12:00:00Z',
        authorName: 'Saori',
        assignedToName: 'Sin asignar'
      }
    ];
    mockTicketReadModel.getTicketsByCreator.mockResolvedValue(mockTickets);

    const query = new GetMyTicketsQuery({ userId: 'saori-uuid' });
    const result = await handler.handle(query);

    expect(result).toEqual(mockTickets);
    expect(mockTicketReadModel.getTicketsByCreator).toHaveBeenCalledTimes(1);
    expect(mockTicketReadModel.getTicketsByCreator).toHaveBeenCalledWith('saori-uuid');
  });

  it('debe devolver [] cuando el usuario no ha creado tickets', async () => {
    mockTicketReadModel.getTicketsByCreator.mockResolvedValue([]);

    const query = new GetMyTicketsQuery({ userId: 'saori-uuid' });
    const result = await handler.handle(query);

    expect(result).toEqual([]);
    expect(mockTicketReadModel.getTicketsByCreator).toHaveBeenCalledWith('saori-uuid');
  });

  it('debe lanzar BusinessError 401 si no se proporciona userId', async () => {
    const query = new GetMyTicketsQuery({});

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({
      message: 'El usuario autenticado es obligatorio',
      statusCode: 401
    });
    expect(mockTicketReadModel.getTicketsByCreator).not.toHaveBeenCalled();
  });
});

