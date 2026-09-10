class AssignTicketUseCase {
  constructor({ ticketRepository, notificationService }) {
    this.ticketRepository = ticketRepository;
    this.notificationService = notificationService;
  }

  async execute(ticketId, assigneeId) {
    return { ticketId, assigneeId, status: 'assigned' };
  }
}

module.exports = AssignTicketUseCase;
