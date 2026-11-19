const BusinessError = require('../exceptions/BusinessError');
const UserRole = require('../enums/UserRole');

class TicketEvidenceAccessPolicy {
  assertCanAccess(ticket, user, { forUpload = false } = {}) {
    if (!ticket) throw new BusinessError('Ticket no encontrado', 404);
    const roles = Array.isArray(user.roles) ? user.roles : [user.role];
    const normalized = roles.map(role => String(role).toLowerCase());
    if (normalized.includes(UserRole.ADMINISTRADOR)) return;
    if (normalized.includes(UserRole.GERENTE)) {
      const departmentId = ticket.department_id ?? ticket.departmentId;
      if (!user.department_id || departmentId !== user.department_id) {
        throw new BusinessError('No tienes permisos sobre tickets de otro departamento', 403);
      }
      return;
    }
    const creator = ticket.created_by ?? ticket.createdBy ?? ticket.createdById;
    const assignee = ticket.assigned_to ?? ticket.assignedTo ?? ticket.assignedToId;
    const assignedSupport = normalized.includes(UserRole.SOPORTE_TECNICO) && assignee === user.id;
    if (creator !== user.id && (forUpload || !assignedSupport)) {
      throw new BusinessError('No tienes permisos para ver las evidencias de este ticket', 403);
    }
  }
}

module.exports = TicketEvidenceAccessPolicy;
