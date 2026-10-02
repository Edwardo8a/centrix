const GetTicketsByUserQuery = require('../queries/tickets/GetTicketsByUserQuery');
const GetTicketByIdQuery = require('../queries/tickets/GetTicketByIdQuery');
const GetPendingTicketsQuery = require('../queries/tickets/GetPendingTicketsQuery');
const GetAllTicketsQuery = require('../queries/tickets/GetAllTicketsQuery');

const TicketReadModel = require('../repositories/TicketReadModel');
const TicketRepository = require('../repositories/TicketRepository');
const ResponseBuilder = require('../utils/responseBuilder');

const ticketReadModel = new TicketReadModel();
const ticketRepository = new TicketRepository();

const getTicketsByUserQuery = new GetTicketsByUserQuery(ticketReadModel);
const getTicketByIdQuery = new GetTicketByIdQuery(ticketReadModel);
const getPendingTicketsQuery = new GetPendingTicketsQuery(ticketReadModel);
const getAllTicketsQuery = new GetAllTicketsQuery(ticketRepository);

class TicketQueryController {
  static async getMyTickets(req, res, next) {
    try {
      const userId = req.user.id;
      const viewModels = await getTicketsByUserQuery.execute(userId);
      return ResponseBuilder.success(res, viewModels, 'Tickets obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { ticketId } = req.params;
      const viewModel = await getTicketByIdQuery.execute(ticketId);
      return ResponseBuilder.success(res, viewModel, 'Detalle de ticket obtenido exitosamente');
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

  static async getAllTicketsByDepartment(req, res, next) {
    try {
      const { departmentId } = req.params;
      const tickets = await getAllTicketsQuery.execute(departmentId);
      return ResponseBuilder.success(res, tickets, 'Todos los tickets obtenidos del departamento');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TicketQueryController;
