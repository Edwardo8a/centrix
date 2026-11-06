const CreateTicketCommand = require('../commands/tickets/CreateTicketCommand');
const DeleteTicketCommand = require('../commands/tickets/DeleteTicketCommand');
const ChangeTicketStatusCommand = require('../commands/tickets/ChangeTicketStatusCommand');
const AssignTicketCommand = require('../commands/tickets/AssignTicketCommand');
const AddTicketAttachmentCommand = require('../commands/tickets/AddTicketAttachmentCommand');
const ResponseBuilder = require('../utils/responseBuilder');

const ticketCommandControllerFactory = ({
  createTicketHandler,
  deleteTicketHandler,
  changeTicketStatusHandler,
  assignTicketHandler,
  addTicketAttachmentHandler
}) => ({
  // Maneja la creacion de tickets (HU-03)
  create: async (req, res, next) => {
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
  },

  // Maneja la eliminacion logica de tickets
  delete: async (req, res, next) => {
    try {
      const command = new DeleteTicketCommand({
        ticketId: req.params.id,
        userId: req.user.id,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const result = await deleteTicketHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Ticket eliminado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  // Maneja el cambio de estado de tickets
  changeStatus: async (req, res, next) => {
    try {
      const command = new ChangeTicketStatusCommand({
        ticketId: req.params.id,
        newStatus: req.body.status,
        comment: req.body.comment,
        userId: req.user.id,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const result = await changeTicketStatusHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Estado del ticket actualizado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  // Maneja la asignacion/reasignacion de tickets a soporte_tecnico
  assign: async (req, res, next) => {
    try {
      const command = new AssignTicketCommand({
        ticketId: req.params.id,
        assignedTo: req.body.assigned_to,
        userId: req.user.id,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const result = await assignTicketHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Ticket asignado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  // Maneja el registro de evidencias (adjuntos) en un ticket
  addAttachment: async (req, res, next) => {
    try {
      const command = new AddTicketAttachmentCommand({
        ticketId: req.params.id,
        fileUrl: req.body.file_url,
        fileFormat: req.body.file_format,
        sizeBytes: Number(req.body.size_bytes),
        userId: req.user.id,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const result = await addTicketAttachmentHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Evidencia adjuntada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }
});

module.exports = ticketCommandControllerFactory;
