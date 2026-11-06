const GetTicketsByDepartmentQuery = require('../src/queries/tickets/GetTicketsByDepartmentQuery');
const GetTicketsByDepartmentHandler = require('../src/queries/tickets/GetTicketsByDepartmentHandler');
const UserRole = require('../src/enums/UserRole');
const BusinessError = require('../src/exceptions/BusinessError');

describe('GetTicketsByDepartmentHandler', () => {
  let mockTicketReadModel;
  let handler;

  beforeEach(() => {
    mockTicketReadModel = {
      getTicketsByDepartment: jest.fn()
    };
    handler = new GetTicketsByDepartmentHandler({ ticketReadModel: mockTicketReadModel });
  });

  it('debe usar el department_id del gerente autenticado e ignorar parámetros externos (anti-IDOR)', async () => {
    const mockData = [{ ticketId: 't1', title: 'Ticket 1', departmentId: 'dept-gerente' }];
    mockTicketReadModel.getTicketsByDepartment.mockResolvedValue(mockData);

    const query = new GetTicketsByDepartmentQuery({
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-gerente',
      departmentId: 'dept-hacked'
    });

    const result = await handler.handle(query);

    expect(result).toEqual(mockData);
    expect(mockTicketReadModel.getTicketsByDepartment).toHaveBeenCalledWith('dept-gerente');
  });

  it('debe lanzar BusinessError 403 si el gerente no tiene department_id asignado', async () => {
    const query = new GetTicketsByDepartmentQuery({
      userRole: UserRole.GERENTE,
      userDepartmentId: null
    });

    await expect(handler.handle(query)).rejects.toThrow(BusinessError);
    await expect(handler.handle(query)).rejects.toMatchObject({
      message: 'El gerente no tiene un departamento asignado',
      statusCode: 403
    });
    expect(mockTicketReadModel.getTicketsByDepartment).not.toHaveBeenCalled();
  });

  it('debe permitir al administrador consultar cualquier departamento por query param', async () => {
    const mockData = [{ ticketId: 't2', title: 'Ticket 2', departmentId: 'dept-any' }];
    mockTicketReadModel.getTicketsByDepartment.mockResolvedValue(mockData);

    const query = new GetTicketsByDepartmentQuery({
      userRole: UserRole.ADMINISTRADOR,
      userDepartmentId: null,
      departmentId: 'dept-any'
    });

    const result = await handler.handle(query);

    expect(result).toEqual(mockData);
    expect(mockTicketReadModel.getTicketsByDepartment).toHaveBeenCalledWith('dept-any');
  });

  it('debe lanzar BusinessError 400 si el administrador no envía department_id ni tiene uno propio', async () => {
    const query = new GetTicketsByDepartmentQuery({
      userRole: UserRole.ADMINISTRADOR,
      userDepartmentId: null,
      departmentId: null
    });

    await expect(handler.handle(query)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'El parámetro department_id es obligatorio para el administrador',
      statusCode: 400
    });
    expect(mockTicketReadModel.getTicketsByDepartment).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 403 si un rol no autorizado intenta ejecutar la query', async () => {
    const query = new GetTicketsByDepartmentQuery({
      userRole: UserRole.COLABORADOR,
      userDepartmentId: 'dept-1'
    });

    await expect(handler.handle(query)).rejects.toMatchObject({
      name: 'BusinessError',
      statusCode: 403
    });
  });
});

