const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

class DeleteTicketHandler {
  /**
   * @param {{ ticketRepository: import('../../contracts').ITicketRepository }} deps
   */
  constructor({ ticketRepository }) {
    this.ticketRepository = ticketRepository;
  }

  async handle(command) {
    const ticket = await this.ticketRepository.findById(command.ticketId);
    if (!ticket) {
      throw new BusinessError('Ticket no encontrado', 404);
    }

    if (command.userRole === UserRole.GERENTE) {
      if (!command.userDepartmentId) {
        throw new BusinessError('El gerente no tiene un departamento asignado', 403);
      }
      if (ticket.department_id !== command.userDepartmentId) {
        throw new BusinessError('No tienes permisos para eliminar tickets de otro departamento', 403);
      }
    }

    await this.ticketRepository.softDelete(command.ticketId, command.userId);
    return { id: command.ticketId };
  }
}

module.exports = DeleteTicketHandler;
