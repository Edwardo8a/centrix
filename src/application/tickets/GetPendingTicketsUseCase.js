class GetPendingTicketsUseCase {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute() {
    return [];
  }
}

module.exports = GetPendingTicketsUseCase;
