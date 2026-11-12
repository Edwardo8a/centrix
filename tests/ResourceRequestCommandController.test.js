const resourceRequestCommandControllerFactory = require('../src/controllers/ResourceRequestCommandController');
const ResponseBuilder = require('../src/utils/responseBuilder');

jest.mock('../src/utils/responseBuilder');

describe('ResourceRequestCommandController', () => {
  let mockCreateHandler;
  let mockDeleteHandler;
  let controller;
  let req, res, next;

  beforeEach(() => {
    mockCreateHandler = { handle: jest.fn() };
    mockDeleteHandler = { handle: jest.fn() };

    controller = resourceRequestCommandControllerFactory({
      createResourceRequestHandler: mockCreateHandler,
      deleteResourceRequestHandler: mockDeleteHandler
    });

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-uuid', role: 'colaborador', department_id: 'dept-uuid' }
    };
    res = {};
    next = jest.fn();
    ResponseBuilder.success.mockReturnValue('success-response');
  });

  describe('create', () => {
    it('debe ejecutar createResourceRequestHandler y responder 201', async () => {
      req.body = {
        title: 'Silla ergonómica',
        description: 'Se necesita una silla de trabajo',
        category: 'Mobiliario',
        estimated_amount: 2500
      };
      mockCreateHandler.handle.mockResolvedValue({ id: 'rr-001' });

      await controller.create(req, res, next);

      expect(mockCreateHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Silla ergonómica',
          description: 'Se necesita una silla de trabajo',
          category: 'Mobiliario',
          estimatedAmount: 2500,
          departmentId: 'dept-uuid',
          userId: 'user-uuid'
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        { id: 'rr-001' },
        'Solicitud de recurso creada exitosamente',
        201
      );
    });

    it('debe usar department_id del body si se proporciona (caso admin)', async () => {
      req.body = {
        title: 'Proyecto especial',
        description: 'Descripción',
        category: 'Economico',
        department_id: 'dept-especifico'
      };
      req.user = { id: 'user-admin', role: 'administrador', department_id: null };
      mockCreateHandler.handle.mockResolvedValue({ id: 'rr-002' });

      await controller.create(req, res, next);

      expect(mockCreateHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({ departmentId: 'dept-especifico' })
      );
    });

    it('debe llamar a next si ocurre un error en create', async () => {
      const error = new Error('Create error');
      mockCreateHandler.handle.mockRejectedValue(error);

      await controller.create(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('delete', () => {
    it('debe ejecutar deleteResourceRequestHandler y responder 200', async () => {
      req.params = { id: 'rr-001' };
      req.user = { id: 'user-gerente', role: 'gerente', department_id: 'dept-uuid' };
      mockDeleteHandler.handle.mockResolvedValue({ id: 'rr-001', deleted: true });

      await controller.delete(req, res, next);

      expect(mockDeleteHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'rr-001',
          userId: 'user-gerente',
          userRole: 'gerente',
          userDepartmentId: 'dept-uuid'
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        { id: 'rr-001', deleted: true },
        'Solicitud de recurso eliminada exitosamente',
        200
      );
    });

    it('debe llamar a next si ocurre un error en delete', async () => {
      const error = new Error('Delete error');
      mockDeleteHandler.handle.mockRejectedValue(error);
      req.params = { id: 'rr-001' };

      await controller.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
