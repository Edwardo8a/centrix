const CreateTicketCommand = require('../../application/commands/tickets/CreateTicketCommand');
const UpdateTicketStatusCommand = require('../../application/commands/tickets/UpdateTicketStatusCommand');
const AssignTicketCommand = require('../../application/commands/tickets/AssignTicketCommand');

const TicketRepository = require('../../infrastructure/repositories/TicketRepository');
const NotificationService = require('../../infrastructure/services/NotificationService');
const AuditService = require('../../infrastructure/services/AuditService');
const ResponseBuilder = require('../../utils/responseBuilder');

const ticketRepository = new TicketRepository();
const notificationService = new NotificationService();
const auditService = new AuditService();

const createTicketCommand = new CreateTicketCommand({ ticketRepository, auditService });
const updateTicketStatusCommand = new UpdateTicketStatusCommand({
  ticketRepository,
  notificationService,
  auditService
});
const assignTicketCommand = new AssignTicketCommand({ ticketRepository, auditService });

class TicketCommandController {
  // Maneja la creacion de tickets
  static async create(req, res, next) {
    try {
      const { title, description, priority, department_id } = req.body;
      const userId = req.user.id;
      const ticket = await createTicketCommand.execute({ title, description, priority, department_id, userId });
      return ResponseBuilder.success(res, ticket, 'Ticket creado exitosamente (ACID Command)', 201);
    } catch (error) {
      next(error);
    }
  }

  // Maneja la actualizacion del estado del ticket (HU-05: cambio a En revision y notificacion)
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
