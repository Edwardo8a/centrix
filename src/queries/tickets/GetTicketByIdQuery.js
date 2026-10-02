class GetTicketByIdQuery {
  constructor(ticketReadModel) {
    this.ticketReadModel = ticketReadModel;
  }

  async execute(ticketId) {
    return await this.ticketReadModel.getTicketByIdForViewModel(ticketId);
  }
}

module.exports = GetTicketByIdQuery;
