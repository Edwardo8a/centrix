const GetTicketsByUserQuery = require('../../application/queries/tickets/GetTicketsByUserQuery');
const GetTicketByIdQuery = require('../../application/queries/tickets/GetTicketByIdQuery');
const GetPendingTicketsQuery = require('../../application/queries/tickets/GetPendingTicketsQuery');

const TicketReadModel = require('../../infrastructure/read_models/TicketReadModel');
const ResponseBuilder = require('../../utils/responseBuilder');

const ticketReadModel = new TicketReadModel();
const getTicketsByUserQuery = new GetTicketsByUserQuery(ticketReadModel);
const getTicketByIdQuery = new GetTicketByIdQuery(ticketReadModel);
const getPendingTicketsQuery = new GetPendingTicketsQuery(ticketReadModel);

class TicketQueryController {
  static async getMyTickets(req, res, next) {
    try {
      const userId = req.user.id;
      const viewModels = await getTicketsByUserQuery.execute(userId);
      return ResponseBuilder.success(res, viewModels, 'Tickets para ViewModel Flutter obtenidos');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { ticketId } = req.params;
      const viewModel = await getTicketByIdQuery.execute(ticketId);
      return ResponseBuilder.success(res, viewModel, 'Detalle de ticket para ViewModel Flutter obtenido');
    } catch (error) {
      next(error);
    }
  }

  static async getPending(req, res, next) {
    try {
      const viewModels = await getPendingTicketsQuery.execute();
      return ResponseBuilder.success(res, viewModels, 'Tickets pendientes obtenidos');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TicketQueryController;
