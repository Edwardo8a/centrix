class UpdateTicketStatusUseCase {
  constructor({ ticketRepository, auditService }) {
    this.ticketRepository = ticketRepository;
    this.auditService = auditService;
  }

  async execute(ticketId, newStatus, userId) {
    const updated = await this.ticketRepository.updateStatus(ticketId, newStatus);
    if (this.auditService) {
      await this.auditService.logAction(userId, 'UPDATE_TICKET_STATUS', 'tickets', ticketId);
    }
    return updated;
  }
}

module.exports = UpdateTicketStatusUseCase;
