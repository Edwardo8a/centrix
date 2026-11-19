const ticketCommandControllerFactory = require('../src/controllers/TicketCommandController');
const ResponseBuilder = require('../src/utils/responseBuilder');

jest.mock('../src/utils/responseBuilder');

describe('TicketCommandController', () => {
  let mockCreateHandler;
  let mockDeleteHandler;
  let mockChangeStatusHandler;
  let mockAssignHandler;
  let mockAddAttachmentHandler;
  let controller;
  let req, res, next;

  beforeEach(() => {
    mockCreateHandler = { handle: jest.fn() };
    mockDeleteHandler = { handle: jest.fn() };
    mockChangeStatusHandler = { handle: jest.fn() };
    mockAssignHandler = { handle: jest.fn() };
    mockAddAttachmentHandler = { handle: jest.fn() };

    controller = ticketCommandControllerFactory({
      createTicketHandler: mockCreateHandler,
      deleteTicketHandler: mockDeleteHandler,
      changeTicketStatusHandler: mockChangeStatusHandler,
      assignTicketHandler: mockAssignHandler,
      addTicketAttachmentHandler: mockAddAttachmentHandler
    });

    req = {
      body: {},
      params: {},
      user: { id: 'user-uuid', role: 'gerente', department_id: 'dept-uuid' }
    };
    res = {};
    next = jest.fn();
    ResponseBuilder.success.mockReturnValue('success-response');
  });

  describe('create', () => {
    it('debe ejecutar createTicketHandler y responder 201', async () => {
      req.body = {
        title: 'Incidencia',
        description: 'Detalle',
        priority: 'Alta',
        department_id: 'dept-uuid'
      };
      mockCreateHandler.handle.mockResolvedValue({ id: 'ticket-1' });

      await controller.create(req, res, next);

      expect(mockCreateHandler.handle).toHaveBeenCalled();
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        { id: 'ticket-1' },
        'Ticket creado exitosamente',
        201
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
    it('debe ejecutar deleteTicketHandler y responder 200', async () => {
      req.params = { id: 'ticket-uuid' };
      mockDeleteHandler.handle.mockResolvedValue({ id: 'ticket-uuid' });

      await controller.delete(req, res, next);

      expect(mockDeleteHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 'ticket-uuid',
          userId: 'user-uuid',
          userRole: 'gerente',
          userDepartmentId: 'dept-uuid'
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        { id: 'ticket-uuid' },
        'Ticket eliminado exitosamente',
        200
      );
    });

    it('debe llamar a next si ocurre un error en delete', async () => {
      const error = new Error('Delete error');
      mockDeleteHandler.handle.mockRejectedValue(error);
      req.params = { id: 'ticket-uuid' };

      await controller.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('changeStatus', () => {
    it('debe ejecutar changeTicketStatusHandler y responder 200', async () => {
      req.params = { id: 'ticket-uuid' };
      req.body = { status: 'En revision', comment: 'Revisión técnica' };
      mockChangeStatusHandler.handle.mockResolvedValue({
        id: 'ticket-uuid',
        previousStatus: 'Abierto',
        status: 'En revision'
      });

      await controller.changeStatus(req, res, next);

      expect(mockChangeStatusHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 'ticket-uuid',
          newStatus: 'En revision',
          comment: 'Revisión técnica',
          userId: 'user-uuid',
          userRole: 'gerente',
          userDepartmentId: 'dept-uuid'
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        { id: 'ticket-uuid', previousStatus: 'Abierto', status: 'En revision' },
        'Estado del ticket actualizado exitosamente',
        200
      );
    });

    it('debe llamar a next si ocurre un error en changeStatus', async () => {
      const error = new Error('Status error');
      mockChangeStatusHandler.handle.mockRejectedValue(error);
      req.params = { id: 'ticket-uuid' };

      await controller.changeStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('assign', () => {
    it('debe ejecutar assignTicketHandler y responder 200 con { id }', async () => {
      req.params = { id: 'ticket-uuid' };
      req.body = { assigned_to: 'tech-uuid' };
      mockAssignHandler.handle.mockResolvedValue({ id: 'ticket-uuid' });

      await controller.assign(req, res, next);

      expect(mockAssignHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 'ticket-uuid',
          assignedTo: 'tech-uuid',
          userId: 'user-uuid',
          userRole: 'gerente',
          userDepartmentId: 'dept-uuid'
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        { id: 'ticket-uuid' },
        'Ticket asignado exitosamente',
        200
      );
    });

    it('debe llamar a next si ocurre un error en assign', async () => {
      const error = new Error('Assign error');
      mockAssignHandler.handle.mockRejectedValue(error);
      req.params = { id: 'ticket-uuid' };
      req.body = { assigned_to: 'tech-uuid' };

      await controller.assign(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('addAttachment', () => {
    it('debe ejecutar addTicketAttachmentHandler y responder 201 con { id }', async () => {
      req.params = { id: 'ticket-uuid' };
      req.body = {
        file_url: 'ticket-attachments/ticket-uuid/evidencia.png',
        file_format: 'png',
        size_bytes: 12000
      };
      mockAddAttachmentHandler.handle.mockResolvedValue({ id: 'att-uuid' });

      await controller.addAttachment(req, res, next);

      expect(mockAddAttachmentHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 'ticket-uuid',
          fileUrl: 'ticket-attachments/ticket-uuid/evidencia.png',
          fileFormat: 'png',
          sizeBytes: 12000,
          userId: 'user-uuid',
          userRole: 'gerente',
          userDepartmentId: 'dept-uuid'
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        { id: 'att-uuid' },
        'Evidencia adjuntada exitosamente',
        201
      );
    });

    it('debe llamar a next si ocurre un error en addAttachment', async () => {
      const error = new Error('Attachment error');
      mockAddAttachmentHandler.handle.mockRejectedValue(error);
      req.params = { id: 'ticket-uuid' };

      await controller.addAttachment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
