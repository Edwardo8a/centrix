class AssignTicketCommand {
  constructor({ ticketRepository, notificationService }) {
    this.ticketRepository = ticketRepository;
    this.notificationService = notificationService;
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

    return updatedTicket;
  }
}

module.exports = AssignTicketCommand;
