const UpdateTicketStatusCommand = require('../commands/tickets/UpdateTicketStatusCommand');
const BusinessError = require('../exceptions/BusinessError');
const { TicketStatus } = require('../enums/TicketStatus');

describe('HU-05: Actualizacion de estados de tickets (PPS-90 y PPS-91)', () => {
  let mockTicketRepository;
  let mockNotificationService;
  let mockAuditService;
  let updateTicketStatusCommand;

  beforeEach(() => {
    mockTicketRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
      recordStatusHistory: jest.fn()
    };

    mockNotificationService = {
      notifyUser: jest.fn().mockResolvedValue({ delivered: true })
    };

    mockAuditService = {
      logAction: jest.fn().mockResolvedValue(true)
    };

    updateTicketStatusCommand = new UpdateTicketStatusCommand({
      ticketRepository: mockTicketRepository,
      notificationService: mockNotificationService,
      auditService: mockAuditService
    });

    jest.clearAllMocks();
  });

  describe('PPS-90: Cambio de estado a En revision', () => {
    it('Debe cambiar el estado de Abierto a En revision correctamente', async () => {
      const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
      const userId = 'soporte-tecnico-uuid';
      const creatorId = 'creador-colaborador-uuid';

      mockTicketRepository.findById.mockResolvedValue({
        id: ticketId,
        title: 'Falla en equipo de computo',
        status: 'Abierto',
        created_by: creatorId
      });

      mockTicketRepository.updateStatus.mockResolvedValue({
        id: ticketId,
        title: 'Falla en equipo de computo',
        status: TicketStatus.EN_REVISION,
        created_by: creatorId
      });

      mockTicketRepository.recordStatusHistory.mockResolvedValue({ id: 'history-1' });

      const result = await updateTicketStatusCommand.execute({
        ticketId,
        newStatus: 'En revision',
        userId,
        comment: 'Comenzando analisis del equipo'
      });

      expect(mockTicketRepository.findById).toHaveBeenCalledWith(ticketId);
      expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith(ticketId, TicketStatus.EN_REVISION);
      expect(mockTicketRepository.recordStatusHistory).toHaveBeenCalledWith({
        ticketId,
        userId,
        previousStatus: 'Abierto',
        newStatus: TicketStatus.EN_REVISION,
        comment: 'Comenzando analisis del equipo'
      });
      expect(result.previousStatus).toBe('Abierto');
      expect(result.newStatus).toBe(TicketStatus.EN_REVISION);
    });

    it('Debe normalizar variantes como "en_revision" o "En revisión" al valor estandar', async () => {
      const ticketId = 'ticket-123';
      const userId = 'admin-uuid';

      mockTicketRepository.findById.mockResolvedValue({
        id: ticketId,
        title: 'Problema de red',
        status: 'Abierto',
        created_by: 'creator-uuid'
      });

      mockTicketRepository.updateStatus.mockResolvedValue({
        id: ticketId,
        status: TicketStatus.EN_REVISION
      });

      await updateTicketStatusCommand.execute({
        ticketId,
        newStatus: 'en_revision',
        userId
      });

      expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith(ticketId, TicketStatus.EN_REVISION);
    });

    it('Debe lanzar BusinessError 404 si el ticket no existe', async () => {
      mockTicketRepository.findById.mockResolvedValue(null);

      await expect(
        updateTicketStatusCommand.execute({
          ticketId: 'id-inexistente',
          newStatus: 'En revision',
          userId: 'user-uuid'
        })
      ).rejects.toThrow(BusinessError);

      expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('Debe lanzar BusinessError 400 si el estado ingresado no es valido', async () => {
      mockTicketRepository.findById.mockResolvedValue({
        id: 'ticket-123',
        status: 'Abierto'
      });

      await expect(
        updateTicketStatusCommand.execute({
          ticketId: 'ticket-123',
          newStatus: 'estado_invalido_xyz',
          userId: 'user-uuid'
        })
      ).rejects.toThrow('Estado no valido');

      expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('Debe lanzar BusinessError 400 si el ticket ya se encuentra en el estado solicitado', async () => {
      mockTicketRepository.findById.mockResolvedValue({
        id: 'ticket-123',
        status: 'En revision'
      });

      await expect(
        updateTicketStatusCommand.execute({
          ticketId: 'ticket-123',
          newStatus: 'En revision',
          userId: 'user-uuid'
        })
      ).rejects.toThrow('El ticket ya se encuentra en estado "En revision"');

      expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('Debe lanzar BusinessError 400 si se intenta cambiar el estado de un ticket cerrado', async () => {
      mockTicketRepository.findById.mockResolvedValue({
        id: 'ticket-123',
        status: 'Cerrado'
      });

      await expect(
        updateTicketStatusCommand.execute({
          ticketId: 'ticket-123',
          newStatus: 'En revision',
          userId: 'user-uuid'
        })
      ).rejects.toThrow('No se puede cambiar el estado de un ticket que ya ha sido cerrado');

      expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('PPS-91: Notificacion al usuario creador', () => {
    it('Debe notificar al creador del ticket con mensaje indicando analisis de incidencia', async () => {
      const ticketId = 'ticket-456';
      const creatorId = 'creador-123-uuid';

      mockTicketRepository.findById.mockResolvedValue({
        id: ticketId,
        title: 'Error de inicio de sesion',
        status: 'Abierto',
        created_by: creatorId
      });

      mockTicketRepository.updateStatus.mockResolvedValue({
        id: ticketId,
        status: TicketStatus.EN_REVISION
      });

      mockTicketRepository.recordStatusHistory.mockResolvedValue({ id: 'h-1' });

      await updateTicketStatusCommand.execute({
        ticketId,
        newStatus: 'En revision',
        userId: 'soporte-uuid'
      });

      expect(mockNotificationService.notifyUser).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyUser).toHaveBeenCalledWith(
        creatorId,
        'Actualizacion de estado: Ticket "Error de inicio de sesion"',
        expect.stringContaining('El equipo de soporte tecnico esta analizando tu incidencia')
      );
    });

    it('Debe completar el cambio de estado aun si la notificacion falla de forma no bloqueante', async () => {
      const ticketId = 'ticket-789';
      const creatorId = 'creador-789-uuid';

      mockTicketRepository.findById.mockResolvedValue({
        id: ticketId,
        title: 'Falla de conexion',
        status: 'Abierto',
        created_by: creatorId
      });

      mockTicketRepository.updateStatus.mockResolvedValue({
        id: ticketId,
        status: TicketStatus.EN_REVISION
      });

      mockTicketRepository.recordStatusHistory.mockResolvedValue({ id: 'h-2' });
      mockNotificationService.notifyUser.mockRejectedValue(new Error('Servicio de correo temporalmente inactivo'));

      const result = await updateTicketStatusCommand.execute({
        ticketId,
        newStatus: 'En revision',
        userId: 'soporte-uuid'
      });

      expect(result.newStatus).toBe(TicketStatus.EN_REVISION);
      expect(mockTicketRepository.updateStatus).toHaveBeenCalled();
    });
  });
});
