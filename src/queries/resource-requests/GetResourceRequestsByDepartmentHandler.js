const UserRole = require('../../enums/UserRole');
const { normalizeResourceRequestStatus } = require('../../enums/ResourceRequestStatus');
const BusinessError = require('../../exceptions/BusinessError');

class GetResourceRequestsByDepartmentHandler {
  /**
   * @param {{ resourceRequestReadModel: import('../../contracts').IResourceRequestReadModel }} deps
   */
  constructor({ resourceRequestReadModel }) {
    this.resourceRequestReadModel = resourceRequestReadModel;
  }

  async handle(query = {}) {
    let targetDepartmentId;

    if (query.userRole === UserRole.ADMINISTRADOR) {
      targetDepartmentId = query.departmentId || query.userDepartmentId;
      if (!targetDepartmentId) {
        throw new BusinessError('Debe especificar un department_id para la consulta', 400);
      }
    } else if (query.userRole === UserRole.GERENTE) {
      if (!query.userDepartmentId) {
        throw new BusinessError('El gerente no tiene un departamento asignado', 403);
      }
      if (query.departmentId && query.departmentId !== query.userDepartmentId) {
        throw new BusinessError('No tienes permisos para consultar solicitudes de otro departamento', 403);
      }
      targetDepartmentId = query.userDepartmentId;
    } else {
      throw new BusinessError('No tienes permisos para consultar solicitudes por departamento', 403);
    }

    const rawPage = query.page ?? 1;
    const page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1) {
      throw new BusinessError('El parámetro page debe ser un entero >= 1', 400);
    }

    const rawLimit = query.limit ?? 20;
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BusinessError('El parámetro limit debe estar entre 1 y 100', 400);
    }

    let normalizedStatus = null;
    if (query.status) {
      normalizedStatus = normalizeResourceRequestStatus(query.status);
    }

    return await this.resourceRequestReadModel.getRequestsByDepartment(targetDepartmentId, {
      status: normalizedStatus,
      page,
      limit
    });
  }
}

module.exports = GetResourceRequestsByDepartmentHandler;
