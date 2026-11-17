const BusinessError = require('../../exceptions/BusinessError');
const UserRole = require('../../enums/UserRole');

class GetPendingTicketsHandler {
  constructor({ ticketReadModel }) {
    this.ticketReadModel = ticketReadModel;
  }

  async handle({ user }) {
    if (user.role === UserRole.ADMINISTRADOR) return this.ticketReadModel.getPendingTickets();
    if (user.role !== UserRole.GERENTE || !user.department_id) {
      throw new BusinessError('No tienes un departamento autorizado para consultar pendientes', 403);
    }
    return this.ticketReadModel.getPendingTickets(user.department_id);
  }
}

module.exports = GetPendingTicketsHandler;
