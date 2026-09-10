const CreateTicketUseCase = require('../../application/tickets/CreateTicketUseCase');
const GetTicketsByUserUseCase = require('../../application/tickets/GetTicketsByUserUseCase');
const TicketRepository = require('../../infrastructure/repositories/TicketRepository');
const AuditService = require('../../infrastructure/services/AuditService');
const ResponseBuilder = require('../../utils/responseBuilder');

const ticketRepository = new TicketRepository();
const auditService = new AuditService();
const createTicketUseCase = new CreateTicketUseCase({ ticketRepository, auditService });
const getTicketsByUserUseCase = new GetTicketsByUserUseCase(ticketRepository);

class TicketController {
  static async create(req, res, next) {
    try {
      const { title, description, category } = req.body;
      const userId = req.user.id;
      const ticket = await createTicketUseCase.execute({ title, description, category, userId });
      return ResponseBuilder.success(res, ticket, 'Ticket creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyTickets(req, res, next) {
    try {
      const userId = req.user.id;
      const tickets = await getTicketsByUserUseCase.execute(userId);
      return ResponseBuilder.success(res, tickets, 'Tickets obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TicketController;
