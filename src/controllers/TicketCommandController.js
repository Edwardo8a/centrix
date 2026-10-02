const CreateTicketCommand = require('../commands/tickets/CreateTicketCommand');
const { createTicketHandler } = require('../config/container');
const ResponseBuilder = require('../utils/responseBuilder');

class TicketCommandController {
  // Maneja la creacion de tickets (HU-03)
  static async create(req, res, next) {
    try {
      const command = new CreateTicketCommand({
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
        departmentId: req.body.department_id,
        userId: req.user.id
      });
      
      const result = await createTicketHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Ticket creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TicketCommandController;
