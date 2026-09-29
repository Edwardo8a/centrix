const BusinessError = require('../../../core/exceptions/BusinessError');
const { TicketStatus, normalizeTicketStatus } = require('../../../core/enums/TicketStatus');

class UpdateTicketStatusCommand {
  constructor({ ticketRepository, notificationService, auditService }) {
    this.ticketRepository = ticketRepository;
    this.notificationService = notificationService;
    this.auditService = auditService;
  }

  // Ejecuta la logica de negocio para la actualizacion del estado de un ticket (HU-05)
  async execute({ ticketId, newStatus, userId, comment }) {
    if (!ticketId) {
      throw new BusinessError('El identificador del ticket es obligatorio', 400);
    }

    if (!newStatus) {
      throw new BusinessError('El nuevo estado es obligatorio', 400);
    }

    // 1. Validar que el ticket exista en el sistema
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new BusinessError('El ticket especificado no existe', 404);
    }

    // 2. Normalizar y validar el estado solicitado
    const canonicalStatus = normalizeTicketStatus(newStatus);
    if (!canonicalStatus) {
      throw new BusinessError(
        `Estado no valido. Los estados permitidos son: ${Object.values(TicketStatus).join(', ')}`,
        400
      );
    }

    // Estado actual registrado en el ticket
    const currentStatus = ticket.status || ticket.estado || TicketStatus.ABIERTO;

    // 3. Reglas de transicion de estados
    if (currentStatus.toLowerCase() === canonicalStatus.toLowerCase()) {
      throw new BusinessError(`El ticket ya se encuentra en estado "${canonicalStatus}"`, 400);
    }

    if (currentStatus.toLowerCase() === TicketStatus.CERRADO.toLowerCase()) {
      throw new BusinessError('No se puede cambiar el estado de un ticket que ya ha sido cerrado', 400);
    }

    // 4. PPS-90: Actualizar el estado del ticket en la base de datos
    const updatedTicket = await this.ticketRepository.updateStatus(ticketId, canonicalStatus);

    // 5. PPS-90: Registrar el movimiento en la tabla de historial de auditoria
    const historyComment = comment || `Cambio de estado de "${currentStatus}" a "${canonicalStatus}"`;
    await this.ticketRepository.recordStatusHistory({
      ticketId,
      userId,
      previousStatus: currentStatus,
      newStatus: canonicalStatus,
      comment: historyComment
    });

    // 6. PPS-91: Notificar al usuario creador sobre el cambio de estado
    const creatorId = ticket.created_by || ticket.id_creador;
    let notificationResult = null;

    if (creatorId && this.notificationService) {
      const ticketTitle = ticket.title || ticket.titulo || 'Incidencia';
      const notificationTitle = `Actualizacion de estado: Ticket "${ticketTitle}"`;
      
      let notificationMessage = `Tu ticket ha cambiado al estado "${canonicalStatus}".`;
      if (canonicalStatus === TicketStatus.EN_REVISION) {
        notificationMessage = `Tu ticket "${ticketTitle}" ha cambiado a estado "En revision". El equipo de soporte tecnico esta analizando tu incidencia.`;
      }

      try {
        notificationResult = await this.notificationService.notifyUser(
          creatorId,
          notificationTitle,
          notificationMessage
        );
      } catch (notifErr) {
        console.warn('[UpdateTicketStatusCommand] Error al enviar notificacion al creador:', notifErr.message);
      }
    }

    // 7. Registro de accion en el servicio de auditoria general
    if (this.auditService) {
      try {
        await this.auditService.logAction(userId, 'UPDATE_TICKET_STATUS', 'tickets', ticketId);
      } catch (auditErr) {
        console.warn('[UpdateTicketStatusCommand] Error al registrar auditoria general:', auditErr.message);
      }
    }

    return {
      ticket: updatedTicket,
      previousStatus: currentStatus,
      newStatus: canonicalStatus,
      creatorNotified: Boolean(creatorId),
      notification: notificationResult
    };
  }
}

module.exports = UpdateTicketStatusCommand;
