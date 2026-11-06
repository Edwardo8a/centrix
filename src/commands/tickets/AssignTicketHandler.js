const { TicketStatus, ALLOWED_STATUS_TRANSITIONS } = require('../../enums/TicketStatus');
const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

class AssignTicketHandler {
  /**
   * @param {{ ticketRepository: import('../../contracts').ITicketRepository, userReadModel: import('../../contracts').IUserReadModel }} deps
   */
  constructor({ ticketRepository, userReadModel }) {
    this.ticketRepository = ticketRepository;
    this.userReadModel = userReadModel;
  }

  async handle(command) {
    // 1. Verificar que el ticket exista y no esté eliminado
    const ticket = await this.ticketRepository.findById(command.ticketId);
    if (!ticket) {
      throw new BusinessError('Ticket no encontrado', 404);
    }

    // 2. Validar alcance departamental para el rol gerente (anti-IDOR)
    if (command.userRole === UserRole.GERENTE) {
      if (!command.userDepartmentId) {
        throw new BusinessError('El gerente no tiene un departamento asignado', 403);
      }
      if (ticket.department_id !== command.userDepartmentId) {
        throw new BusinessError('No tienes permisos para asignar tickets de otro departamento', 403);
      }
    }

    // 3. No permitir asignar si el ticket está en estado final (Cerrado o Rechazado)
    const isTerminalStatus =
      ticket.status === TicketStatus.CERRADO ||
      ticket.status === TicketStatus.RECHAZADO ||
      (Array.isArray(ALLOWED_STATUS_TRANSITIONS[ticket.status]) &&
        ALLOWED_STATUS_TRANSITIONS[ticket.status].length === 0);

    if (isTerminalStatus) {
      throw new BusinessError(`No se puede asignar un ticket en estado "${ticket.status}"`, 409);
    }

    // 4. Evitar asignar al mismo usuario ya asignado
    if (ticket.assigned_to && ticket.assigned_to === command.assignedTo) {
      throw new BusinessError('El ticket ya se encuentra asignado a este usuario', 409);
    }

    // 5. Verificar que el usuario a asignar exista, pertenezca al mismo departamento del ticket y sea soporte_tecnico
    const assignee = await this.userReadModel.findById(command.assignedTo);
    if (!assignee) {
      throw new BusinessError('El usuario a asignar no existe', 404);
    }

    if (assignee.department_id !== ticket.department_id) {
      throw new BusinessError('El usuario a asignar no pertenece al departamento del ticket', 400);
    }

    const assigneeRoles = Array.isArray(assignee.roles)
      ? assignee.roles.map(r => String(r).toLowerCase())
      : (assignee.role ? [String(assignee.role).toLowerCase()] : []);

    if (!assigneeRoles.includes(UserRole.SOPORTE_TECNICO)) {
      throw new BusinessError('El usuario a asignar debe tener el rol de soporte_tecnico', 400);
    }

    const assigneeName = [assignee.nombre, assignee.apellido_pat, assignee.apellido_mat]
      .filter(Boolean)
      .join(' ')
      .trim() || assignee.id;
    const actionLabel = ticket.assigned_to ? 'Ticket reasignado a' : 'Ticket asignado a';
    const comment = `${actionLabel} ${assigneeName} (${assignee.id})`;

    const result = await this.ticketRepository.assign({
      ticketId: command.ticketId,
      assignedTo: command.assignedTo,
      userId: command.userId,
      comment
    });

    return { id: result.id };
  }
}

module.exports = AssignTicketHandler;

