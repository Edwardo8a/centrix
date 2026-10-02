class GetPendingTicketsQuery {
  constructor(ticketReadModel) {
    this.ticketReadModel = ticketReadModel;
  }

  async execute() {
    return await this.ticketReadModel.getPendingTicketsForManager();
  }
}

module.exports = GetPendingTicketsQuery;
