class GetTicketsByUserQuery {
  constructor(ticketReadModel) {
    this.ticketReadModel = ticketReadModel;
  }

  async execute(userId) {
    return await this.ticketReadModel.getTicketsByUserForViewModel(userId);
  }
}

module.exports = GetTicketsByUserQuery;
