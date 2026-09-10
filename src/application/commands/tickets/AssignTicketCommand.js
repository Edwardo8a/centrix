class AssignTicketCommand {
  constructor({ ticketRepository, notificationService, auditService }) {
    this.ticketRepository = ticketRepository;
    this.notificationService = notificationService;
    this.auditService = auditService;
  }

  async execute({ ticketId, assigneeId, assignedBy }) {
    const updatedTicket = await this.ticketRepository.assign(ticketId, assigneeId, assignedBy);

    if (this.notificationService) {
      await this.notificationService.notifyUser(
        assigneeId,
        'Ticket Asignado',
        `Se te ha asignado el ticket #${ticketId}`
      );
    }

    if (this.auditService) {
      await this.auditService.logAction(assignedBy, 'ASSIGN_TICKET', 'tickets', ticketId);
    }

    return updatedTicket;
  }
}

module.exports = AssignTicketCommand;
