const CreateTicketCommand = require('../../application/commands/tickets/CreateTicketCommand');
const UpdateTicketStatusCommand = require('../../application/commands/tickets/UpdateTicketStatusCommand');
const AssignTicketCommand = require('../../application/commands/tickets/AssignTicketCommand');

const TicketRepository = require('../../infrastructure/repositories/TicketRepository');
const AuditService = require('../../infrastructure/services/AuditService');
const ResponseBuilder = require('../../utils/responseBuilder');

const ticketRepository = new TicketRepository();
const auditService = new AuditService();

const createTicketCommand = new CreateTicketCommand({ ticketRepository, auditService });
const updateTicketStatusCommand = new UpdateTicketStatusCommand({ ticketRepository, auditService });
const assignTicketCommand = new AssignTicketCommand({ ticketRepository, auditService });

class TicketCommandController {
  static async create(req, res, next) {
    try {
      const { title, description, category } = req.body;
      const userId = req.user.id;
      const ticket = await createTicketCommand.execute({ title, description, category, userId });
      return ResponseBuilder.success(res, ticket, 'Ticket creado exitosamente (ACID Command)', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const updated = await updateTicketStatusCommand.execute({ ticketId, newStatus: status, userId });
      return ResponseBuilder.success(res, updated, 'Estado del ticket actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  static async assign(req, res, next) {
    try {
      const { ticketId } = req.params;
      const { assigneeId } = req.body;
      const assignedBy = req.user.id;
      const result = await assignTicketCommand.execute({ ticketId, assigneeId, assignedBy });
      return ResponseBuilder.success(res, result, 'Ticket asignado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TicketCommandController;
