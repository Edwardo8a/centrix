const UpdateTicketStatusCommand = require('../commands/tickets/UpdateTicketStatusCommand');

// Caso de uso que envuelve el comando de actualizacion de estado para mantener compatibilidad
class UpdateTicketStatusUseCase {
  constructor({ ticketRepository, notificationService, auditService }) {
    this.command = new UpdateTicketStatusCommand({ ticketRepository, notificationService, auditService });
  }

  async execute(ticketId, newStatus, userId, comment) {
    return await this.command.execute({ ticketId, newStatus, userId, comment });
  }
}

module.exports = UpdateTicketStatusUseCase;
