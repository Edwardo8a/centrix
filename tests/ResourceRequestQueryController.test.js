const resourceRequestQueryControllerFactory = require('../src/controllers/ResourceRequestQueryController');
const ResponseBuilder = require('../src/utils/responseBuilder');

jest.mock('../src/utils/responseBuilder');

describe('ResourceRequestQueryController', () => {
  let mockGetMineHandler;
  let mockGetByDepartmentHandler;
  let mockGetByIdHandler;
  let controller;
  let req, res, next;

  beforeEach(() => {
    mockGetMineHandler = { handle: jest.fn() };
    mockGetByDepartmentHandler = { handle: jest.fn() };
    mockGetByIdHandler = { handle: jest.fn() };

    controller = resourceRequestQueryControllerFactory({
      getMyResourceRequestsHandler: mockGetMineHandler,
      getResourceRequestsByDepartmentHandler: mockGetByDepartmentHandler,
      getResourceRequestByIdHandler: mockGetByIdHandler
    });

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-uuid', role: 'gerente', department_id: 'dept-uuid' }
    };
    res = {};
    next = jest.fn();
    ResponseBuilder.success.mockReturnValue('success-response');
  });

  describe('getMine', () => {
    it('debe ejecutar getMyResourceRequestsHandler y responder 200', async () => {
      const mockData = [{ id: 'rr-001', title: 'Silla' }];
      mockGetMineHandler.handle.mockResolvedValue(mockData);

      await controller.getMine(req, res, next);

      expect(mockGetMineHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-uuid' })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        mockData,
        'Mis solicitudes de recursos obtenidas exitosamente',
        200
      );
    });

    it('debe llamar a next si ocurre un error en getMine', async () => {
      const error = new Error('Read error');
      mockGetMineHandler.handle.mockRejectedValue(error);

      await controller.getMine(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getByDepartment', () => {
    it('debe ejecutar getResourceRequestsByDepartmentHandler con los parámetros correctos y responder 200', async () => {
      const mockData = { data: [{ id: 'rr-001' }], total: 1, page: 1, limit: 20 };
      req.query = { department_id: 'dept-002', status: 'Pendiente', page: '2', limit: '10' };
      mockGetByDepartmentHandler.handle.mockResolvedValue(mockData);

      await controller.getByDepartment(req, res, next);

      expect(mockGetByDepartmentHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          userRole: 'gerente',
          userDepartmentId: 'dept-uuid',
          departmentId: 'dept-002',
          status: 'Pendiente',
          page: 2,
          limit: 10
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        mockData,
        'Solicitudes de recursos del departamento obtenidas exitosamente',
        200
      );
    });

    it('debe usar valores por defecto (page=1, limit=20) si no se pasan en query', async () => {
      req.query = { department_id: 'dept-001' };
      mockGetByDepartmentHandler.handle.mockResolvedValue({ data: [], total: 0 });

      await controller.getByDepartment(req, res, next);

      expect(mockGetByDepartmentHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });

    it('debe llamar a next si ocurre un error en getByDepartment', async () => {
      const error = new Error('Dept error');
      mockGetByDepartmentHandler.handle.mockRejectedValue(error);

      await controller.getByDepartment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('debe ejecutar getResourceRequestByIdHandler y responder 200', async () => {
      req.params = { id: 'rr-001' };
      const mockRequest = { id: 'rr-001', title: 'Silla', status: 'Pendiente' };
      mockGetByIdHandler.handle.mockResolvedValue(mockRequest);

      await controller.getById(req, res, next);

      expect(mockGetByIdHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'rr-001',
          userId: 'user-uuid',
          userRole: 'gerente',
          userDepartmentId: 'dept-uuid'
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        mockRequest,
        'Detalle de la solicitud de recurso obtenido exitosamente',
        200
      );
    });

    it('debe llamar a next si ocurre un error en getById', async () => {
      const error = new Error('Not found');
      mockGetByIdHandler.handle.mockRejectedValue(error);
      req.params = { id: 'rr-inexistente' };

      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
