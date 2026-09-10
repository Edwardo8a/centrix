class GetTicketsByUserUseCase {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(userId) {
    return await this.ticketRepository.findByUser(userId);
  }
}

module.exports = GetTicketsByUserUseCase;
