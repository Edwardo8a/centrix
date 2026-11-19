const GetAllTicketsQuery = require('../src/queries/tickets/GetAllTicketsQuery');
const GetAllTicketsHandler = require('../src/queries/tickets/GetAllTicketsHandler');
const BusinessError = require('../src/exceptions/BusinessError');

describe('GetAllTicketsQuery & GetAllTicketsHandler', () => {
  let mockTicketReadModel;
  let handler;

  beforeEach(() => {
    mockTicketReadModel = {
      getAllTickets: jest.fn()
    };
    handler = new GetAllTicketsHandler({ ticketReadModel: mockTicketReadModel });
  });

  it('debe crear un DTO inmutable GetAllTicketsQuery con valores por defecto', () => {
    const query = new GetAllTicketsQuery();

    expect(query).toEqual({
      status: null,
      departmentId: null,
      priority: null,
      page: 1,
      limit: 20
    });
    expect(Object.isFrozen(query)).toBe(true);
  });

  it('debe consultar tickets con paginación por defecto (page=1, limit=20) sin filtros', async () => {
    const expectedResult = {
      items: [{ ticketId: 't-1', title: 'Ticket Global' }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 }
    };
    mockTicketReadModel.getAllTickets.mockResolvedValue(expectedResult);

    const query = new GetAllTicketsQuery();
    const result = await handler.handle(query);

    expect(mockTicketReadModel.getAllTickets).toHaveBeenCalledWith({
      status: null,
      departmentId: null,
      priority: null,
      page: 1,
      limit: 20
    });
    expect(result).toEqual(expectedResult);
  });

  it('debe normalizar status y priority y aplicar departmentId, page y limit', async () => {
    mockTicketReadModel.getAllTickets.mockResolvedValue({
      items: [],
      pagination: { total: 0, page: 2, limit: 10, totalPages: 0 }
    });

    const query = new GetAllTicketsQuery({
      status: '  en revisión  ',
      departmentId: 'dept-123',
      priority: 'crítica',
      page: 2,
      limit: 10
    });

    await handler.handle(query);

    expect(mockTicketReadModel.getAllTickets).toHaveBeenCalledWith({
      status: 'En revision',
      departmentId: 'dept-123',
      priority: 'Critica',
      page: 2,
      limit: 10
    });
  });

  it('debe lanzar BusinessError 400 si status es inválido', async () => {
    const query = new GetAllTicketsQuery({ status: 'EstadoInexistente' });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({
      statusCode: 400,
      message: 'El estado proporcionado no es válido'
    });
    expect(mockTicketReadModel.getAllTickets).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 400 si priority es inválida', async () => {
    const query = new GetAllTicketsQuery({ priority: 'Urgente' });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({
      statusCode: 400,
      message: 'La prioridad debe ser Baja, Media, Alta o Critica'
    });
    expect(mockTicketReadModel.getAllTickets).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 400 si page < 1 o no es entero', async () => {
    await expect(handler.handle(new GetAllTicketsQuery({ page: 0 }))).rejects.toMatchObject({
      statusCode: 400
    });
    await expect(handler.handle(new GetAllTicketsQuery({ page: -3 }))).rejects.toMatchObject({
      statusCode: 400
    });
    await expect(handler.handle(new GetAllTicketsQuery({ page: 'abc' }))).rejects.toMatchObject({
      statusCode: 400
    });
  });

  it('debe lanzar BusinessError 400 si limit < 1 o supera el tope máximo (100)', async () => {
    await expect(handler.handle(new GetAllTicketsQuery({ limit: 0 }))).rejects.toMatchObject({
      statusCode: 400
    });
    await expect(handler.handle(new GetAllTicketsQuery({ limit: 101 }))).rejects.toMatchObject({
      statusCode: 400,
      message: 'El parámetro limit debe ser un entero entre 1 y 100'
    });
  });
});

