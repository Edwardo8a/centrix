const BusinessError = require('../../exceptions/BusinessError');

class GetMyTicketsHandler {
  /**
   * @param {{ ticketReadModel: import('../../contracts').ITicketReadModel }} deps
   */
  constructor({ ticketReadModel }) {
    this.ticketReadModel = ticketReadModel;
  }

  async handle(query) {
    if (!query || !query.userId) {
      throw new BusinessError('El usuario autenticado es obligatorio', 401);
    }

    return await this.ticketReadModel.getTicketsByCreator(query.userId);
  }
}

module.exports = GetMyTicketsHandler;

