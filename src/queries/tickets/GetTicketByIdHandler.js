const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

class GetTicketByIdHandler {
  /**
   * @param {{ ticketReadModel: import('../../contracts').ITicketReadModel }} deps
   */
  constructor({ ticketReadModel }) {
    this.ticketReadModel = ticketReadModel;
  }

  async handle(query) {
    const ticket = await this.ticketReadModel.getTicketById(query.ticketId);

    if (!ticket) {
      throw new BusinessError('Ticket no encontrado', 404);
    }

    if (query.userRole === UserRole.ADMINISTRADOR) {
      // Acceso total
    } else if (query.userRole === UserRole.GERENTE) {
      if (!query.userDepartmentId) {
        throw new BusinessError('El gerente no tiene un departamento asignado', 403);
      }
      if (ticket.departmentId !== query.userDepartmentId) {
        throw new BusinessError('No tienes permiso para consultar un ticket de otro departamento', 403);
      }
    } else if (query.userRole === UserRole.SOPORTE_TECNICO) {
      if (ticket.assignedTo !== query.userId && ticket.createdBy !== query.userId) {
        throw new BusinessError('No tienes permiso para consultar este ticket', 403);
      }
    } else {
      if (ticket.createdBy !== query.userId) {
        throw new BusinessError('No tienes permiso para consultar este ticket', 403);
      }
    }

    let attachments;
    if (Array.isArray(ticket._rawAttachments) && typeof this.ticketReadModel.signAttachments === 'function') {
      attachments =
        ticket._rawAttachments.length > 0
          ? await this.ticketReadModel.signAttachments(ticket._rawAttachments)
          : [];
    } else {
      attachments = await this.ticketReadModel.getAttachmentsWithSignedUrls(query.ticketId);
    }

    return {
      ...ticket,
      attachments
    };
  }
}

module.exports = GetTicketByIdHandler;
