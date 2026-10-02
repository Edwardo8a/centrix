const CreateTicketCommand = require('../commands/tickets/CreateTicketCommand');
const UpdateTicketStatusCommand = require('../commands/tickets/UpdateTicketStatusCommand');
const AssignTicketCommand = require('../commands/tickets/AssignTicketCommand');

const TicketRepository = require('../repositories/TicketRepository');
const NotificationService = require('../services/NotificationService');
const ResponseBuilder = require('../utils/responseBuilder');

const ticketRepository = new TicketRepository();
const notificationService = new NotificationService();

const createTicketCommand = new CreateTicketCommand({ ticketRepository });
const updateTicketStatusCommand = new UpdateTicketStatusCommand({
  ticketRepository,
  notificationService
});
const assignTicketCommand = new AssignTicketCommand({ ticketRepository, notificationService });

class TicketCommandController {
  // Maneja la creacion de tickets (HU-03)
  static async create(req, res, next) {
    try {
      const { title, description, priority, department_id } = req.body;
      const userId = req.user.id;
      const ticket = await createTicketCommand.execute({ title, description, priority, department_id, userId });
      return ResponseBuilder.success(res, ticket, 'Ticket creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  // Maneja la actualizacion del estado del ticket (HU-05)
  static async updateStatus(req, res, next) {
    try {
      const { ticketId } = req.params;
      const { status, comment, comentario } = req.body;
      const userId = req.user.id;

      const result = await updateTicketStatusCommand.execute({
        ticketId,
        newStatus: status,
        userId,
        comment: comment || comentario
      });

      return ResponseBuilder.success(res, result, 'Estado del ticket actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Maneja la asignacion de un ticket a un responsable
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
