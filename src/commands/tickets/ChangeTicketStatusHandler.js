const { normalizeTicketStatus, isValidTransition, TicketStatus } = require('../../enums/TicketStatus');
const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

const SOPORTE_ALLOWED_TARGET_STATUSES = [
  TicketStatus.EN_REVISION,
  TicketStatus.EN_PROGRESO,
  TicketStatus.RESUELTO
];

class ChangeTicketStatusHandler {
  /**
   * @param {{ ticketRepository: import('../../contracts').ITicketRepository }} deps
   */
  constructor({ ticketRepository }) {
    this.ticketRepository = ticketRepository;
  }

  async handle(command) {
    const normalizedStatus = normalizeTicketStatus(command.newStatus);
    if (!normalizedStatus) {
      throw new BusinessError('Estado de ticket no válido', 400);
    }

    const ticket = await this.ticketRepository.findById(command.ticketId);
    if (!ticket) {
      throw new BusinessError('Ticket no encontrado', 404);
    }

    if (command.userRole === UserRole.GERENTE) {
      if (!command.userDepartmentId) {
        throw new BusinessError('El gerente no tiene un departamento asignado', 403);
      }
      if (ticket.department_id !== command.userDepartmentId) {
        throw new BusinessError('No tienes permisos para modificar tickets de otro departamento', 403);
      }
    } else if (command.userRole === UserRole.SOPORTE_TECNICO) {
      if (!ticket.assigned_to || ticket.assigned_to !== command.userId) {
        throw new BusinessError(
          'No tienes permisos para cambiar el estado de un ticket que no tienes asignado',
          403
        );
      }
      if (!SOPORTE_ALLOWED_TARGET_STATUSES.includes(normalizedStatus)) {
        throw new BusinessError(
          `El rol soporte_tecnico no tiene permisos para cambiar el ticket al estado "${normalizedStatus}"`,
          403
        );
      }
    }

    if (ticket.status === normalizedStatus) {
      throw new BusinessError('El ticket ya se encuentra en ese estado', 409);
    }

    if (!isValidTransition(ticket.status, normalizedStatus)) {
      throw new BusinessError(
        `No se permite la transición de estado de "${ticket.status}" a "${normalizedStatus}"`,
        409
      );
    }

    if (normalizedStatus === TicketStatus.CERRADO) {
      if (!command.comment || typeof command.comment !== 'string' || !command.comment.trim()) {
        throw new BusinessError('El comentario es obligatorio para cerrar el ticket', 400);
      }
    }

    if (normalizedStatus === TicketStatus.RECHAZADO) {
      if (!command.comment || typeof command.comment !== 'string' || !command.comment.trim()) {
        throw new BusinessError('El comentario es obligatorio para rechazar el ticket', 400);
      }
    }

    if (normalizedStatus === TicketStatus.RESUELTO) {
      if (!command.comment || typeof command.comment !== 'string' || !command.comment.trim()) {
        throw new BusinessError('El comentario es obligatorio para marcar el ticket como Resuelto', 400);
      }
    }

    const result = await this.ticketRepository.updateStatus({
      ticketId: command.ticketId,
      userId: command.userId,
      newStatus: normalizedStatus,
      previousStatus: ticket.status,
      comment: command.comment ? command.comment.trim() : null
    });

    return {
      id: result.id,
      previousStatus: result.previousStatus,
      status: result.status
    };
  }
}

module.exports = ChangeTicketStatusHandler;
