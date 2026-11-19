const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

class GetDepartmentSolversHandler {
  /**
   * @param {{ userReadModel: import('../../contracts').IUserReadModel }} deps
   */
  constructor({ userReadModel }) {
    this.userReadModel = userReadModel;
  }

  async handle(query) {
    let targetDepartmentId;

    if (query.userRole === UserRole.ADMINISTRADOR) {
      if (!query.departmentId) {
        throw new BusinessError('El parámetro department_id es obligatorio para el administrador', 400);
      }
      targetDepartmentId = query.departmentId;
    } else if (query.userRole === UserRole.GERENTE) {
      if (!query.userDepartmentId) {
        throw new BusinessError('El gerente no tiene un departamento asignado', 403);
      }
      targetDepartmentId = query.userDepartmentId;
    } else {
      throw new BusinessError('No tienes permisos para consultar los solucionadores del departamento', 403);
    }

    return await this.userReadModel.getSolversByDepartment(targetDepartmentId);
  }
}

module.exports = GetDepartmentSolversHandler;

