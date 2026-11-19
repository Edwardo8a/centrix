const ticketQueryControllerFactory = require('../src/controllers/TicketQueryController');
const ResponseBuilder = require('../src/utils/responseBuilder');

jest.mock('../src/utils/responseBuilder');

describe('TicketQueryController', () => {
  let mockGetTicketsByDepartmentHandler;
  let mockGetMyTicketsHandler;
  let mockGetAssignedTicketsHandler;
  let mockGetAllTicketsHandler;
  let mockGetTicketByIdHandler;
  let controller;
  let req, res, next;

  beforeEach(() => {
    mockGetTicketsByDepartmentHandler = { handle: jest.fn() };
    mockGetMyTicketsHandler = { handle: jest.fn() };
    mockGetAssignedTicketsHandler = { handle: jest.fn() };
    mockGetAllTicketsHandler = { handle: jest.fn() };
    mockGetTicketByIdHandler = { handle: jest.fn() };

    controller = ticketQueryControllerFactory({
      getTicketsByDepartmentHandler: mockGetTicketsByDepartmentHandler,
      getMyTicketsHandler: mockGetMyTicketsHandler,
      getAssignedTicketsHandler: mockGetAssignedTicketsHandler,
      getAllTicketsHandler: mockGetAllTicketsHandler,
      getTicketByIdHandler: mockGetTicketByIdHandler
    });

    req = {
      params: {},
      query: {},
      user: {
        id: 'user-uuid',
        role: 'gerente',
        department_id: 'dept-uuid'
      }
    };
    res = {};
    next = jest.fn();
    ResponseBuilder.success.mockReturnValue('success-response');
  });

  describe('getAll', () => {
    it('debe construir GetAllTicketsQuery con filtros y paginación de req.query y responder 200', async () => {
      req.user = { id: 'admin-uuid', role: 'administrador', department_id: null };
      req.query = {
        status: 'Abierto',
        department_id: 'dept-uuid',
        priority: 'Alta',
        page: '2',
        limit: '15'
      };
      const mockResult = {
        items: [{ ticketId: 't-1', title: 'Ticket 1' }],
        pagination: { total: 1, page: 2, limit: 15, totalPages: 1 }
      };
      mockGetAllTicketsHandler.handle.mockResolvedValue(mockResult);

      await controller.getAll(req, res, next);

      expect(mockGetAllTicketsHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'Abierto',
          departmentId: 'dept-uuid',
          priority: 'Alta',
          page: 2,
          limit: 15
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        mockResult,
        'Tickets obtenidos exitosamente',
        200
      );
    });

    it('debe llamar a next(error) si getAllTicketsHandler lanza un error', async () => {
      const error = new Error('Global query error');
      mockGetAllTicketsHandler.handle.mockRejectedValue(error);

      await controller.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('debe construir GetTicketByIdQuery con datos de req.params.id y req.user y responder 200', async () => {
      req.params = { id: 'ticket-uuid' };
      const mockDetail = {
        ticketId: 'ticket-uuid',
        title: 'Ticket Detalle',
        attachments: [{ id: 'att-1', signedUrl: 'https://signed/url' }]
      };
      mockGetTicketByIdHandler.handle.mockResolvedValue(mockDetail);

      await controller.getById(req, res, next);

      expect(mockGetTicketByIdHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 'ticket-uuid',
          userId: 'user-uuid',
          userRole: 'gerente',
          userDepartmentId: 'dept-uuid'
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        mockDetail,
        'Detalle del ticket obtenido exitosamente',
        200
      );
    });

    it('debe llamar a next(error) si getTicketByIdHandler lanza un error', async () => {
      req.params = { id: 'ticket-uuid' };
      const error = new Error('Detail query error');
      mockGetTicketByIdHandler.handle.mockRejectedValue(error);

      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getByDepartment', () => {
    it('debe construir GetTicketsByDepartmentQuery, invocar al handler y responder 200', async () => {
      const mockTickets = [{ ticketId: 't-1', title: 'Ticket 1' }];
      mockGetTicketsByDepartmentHandler.handle.mockResolvedValue(mockTickets);

      await controller.getByDepartment(req, res, next);

      expect(mockGetTicketsByDepartmentHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          userRole: 'gerente',
          userDepartmentId: 'dept-uuid',
          departmentId: null
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        mockTickets,
        'Tickets del departamento obtenidos exitosamente',
        200
      );
    });

    it('debe pasar department_id de req.query cuando está presente', async () => {
      req.user = { id: 'admin-uuid', role: 'administrador', department_id: null };
      req.query = { department_id: 'dept-target-uuid' };
      mockGetTicketsByDepartmentHandler.handle.mockResolvedValue([]);

      await controller.getByDepartment(req, res, next);

      expect(mockGetTicketsByDepartmentHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          userRole: 'administrador',
          userDepartmentId: null,
          departmentId: 'dept-target-uuid'
        })
      );
    });

    it('debe llamar a next(error) si el handler lanza un error', async () => {
      const error = new Error('Query error');
      mockGetTicketsByDepartmentHandler.handle.mockRejectedValue(error);

      await controller.getByDepartment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getMine', () => {
    it('debe usar exclusivamente req.user.id e ignorar parámetros externos en query/body', async () => {
      req.user = { id: 'saori-uuid', role: 'colaborador', department_id: 'dept-uuid' };
      req.query = { user_id: 'otro-usuario-uuid', created_by: 'otro-usuario-uuid' };
      req.body = { userId: 'otro-usuario-uuid' };

      const mockTickets = [{ ticketId: 't-mine-1', title: 'Mi Ticket' }];
      mockGetMyTicketsHandler.handle.mockResolvedValue(mockTickets);

      await controller.getMine(req, res, next);

      expect(mockGetMyTicketsHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'saori-uuid'
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        mockTickets,
        'Mis tickets obtenidos exitosamente',
        200
      );
    });

    it('debe llamar a next(error) si getMyTicketsHandler lanza un error', async () => {
      const error = new Error('Mine query error');
      mockGetMyTicketsHandler.handle.mockRejectedValue(error);

      await controller.getMine(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAssigned', () => {
    it('debe usar exclusivamente req.user.id e ignorar parámetros externos', async () => {
      req.user = { id: 'tech-uuid', role: 'soporte_tecnico', department_id: 'dept-uuid' };
      req.query = { assigned_to: 'otro-tech-uuid' };

      const mockTickets = [{ ticketId: 't-assigned-1', title: 'Ticket Asignado' }];
      mockGetAssignedTicketsHandler.handle.mockResolvedValue(mockTickets);

      await controller.getAssigned(req, res, next);

      expect(mockGetAssignedTicketsHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'tech-uuid'
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        mockTickets,
        'Tickets asignados obtenidos exitosamente',
        200
      );
    });

    it('debe llamar a next(error) si getAssignedTicketsHandler lanza un error', async () => {
      const error = new Error('Assigned query error');
      mockGetAssignedTicketsHandler.handle.mockRejectedValue(error);

      await controller.getAssigned(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
