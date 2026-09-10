const Ticket = require('../../core/entities/Ticket');

class CreateTicketUseCase {
  constructor({ ticketRepository, notificationService, auditService }) {
    this.ticketRepository = ticketRepository;
    this.notificationService = notificationService;
    this.auditService = auditService;
  }

  async execute({ title, description, category, userId }) {
    const ticket = new Ticket({
      title,
      description,
      category,
      createdBy: userId
    });

    const createdTicket = await this.ticketRepository.create({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      status: ticket.status,
      created_by: ticket.createdBy
    });

    if (this.auditService) {
      await this.auditService.logAction(userId, 'CREATE_TICKET', 'tickets', createdTicket.id);
    }

    return createdTicket;
  }
}

module.exports = CreateTicketUseCase;
