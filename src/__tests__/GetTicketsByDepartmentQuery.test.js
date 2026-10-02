const GetTicketsByDepartmentQuery = require('../queries/tickets/GetTicketsByDepartmentQuery');

describe('GetTicketsByDepartmentQuery', () => {
  let mockTicketReadModel;
  let query;

  beforeEach(() => {
    mockTicketReadModel = {
      getTicketsByDepartment: jest.fn()
    };
    query = new GetTicketsByDepartmentQuery({ ticketReadModel: mockTicketReadModel });
  });

  it('debe devolver la lista que entrega el ReadModel', async () => {
    const mockData = [
      { ticketId: 't1', title: 'Ticket 1', departmentId: 'd1' }
    ];
    mockTicketReadModel.getTicketsByDepartment.mockResolvedValue(mockData);

    const result = await query.execute('d1');

    expect(result).toEqual(mockData);
    expect(mockTicketReadModel.getTicketsByDepartment).toHaveBeenCalledWith('d1');
  });

  it('debe devolver [] cuando no hay tickets', async () => {
    mockTicketReadModel.getTicketsByDepartment.mockResolvedValue([]);

    const result = await query.execute('d2');

    expect(result).toEqual([]);
    expect(mockTicketReadModel.getTicketsByDepartment).toHaveBeenCalledWith('d2');
  });
});
