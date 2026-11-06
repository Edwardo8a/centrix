const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

class GetTicketsByDepartmentHandler {
  /**
   * @param {{ ticketReadModel: import('../../contracts').ITicketReadModel }} deps
   */
  constructor({ ticketReadModel }) {
    this.ticketReadModel = ticketReadModel;
  }

  async handle(query) {
    let targetDepartmentId;

    if (query.userRole === UserRole.ADMINISTRADOR) {
      targetDepartmentId = query.departmentId || query.userDepartmentId;
      if (!targetDepartmentId) {
        throw new BusinessError('El parámetro department_id es obligatorio para el administrador', 400);
      }
    } else if (query.userRole === UserRole.GERENTE) {
      if (!query.userDepartmentId) {
        throw new BusinessError('El gerente no tiene un departamento asignado', 403);
      }
      targetDepartmentId = query.userDepartmentId;
    } else {
      throw new BusinessError('No tienes permisos para consultar tickets por departamento', 403);
    }

    return await this.ticketReadModel.getTicketsByDepartment(targetDepartmentId);
  }
}

module.exports = GetTicketsByDepartmentHandler;

