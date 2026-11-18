const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

class GetResourceRequestByIdHandler {
  /**
   * @param {{ resourceRequestReadModel: import('../../contracts').IResourceRequestReadModel }} deps
   */
  constructor({ resourceRequestReadModel }) {
    this.resourceRequestReadModel = resourceRequestReadModel;
  }

  async handle(query) {
    const request = await this.resourceRequestReadModel.getRequestById(query.requestId);

    if (!request) {
      throw new BusinessError('Solicitud de recurso no encontrada', 404);
    }

    if (query.userRole === UserRole.ADMINISTRADOR) {
      // Acceso total
    } else if (query.userRole === UserRole.GERENTE) {
      if (!query.userDepartmentId) {
        throw new BusinessError('El gerente no tiene un departamento asignado', 403);
      }
      if (request.departmentId !== query.userDepartmentId) {
        throw new BusinessError('No tienes permisos para consultar solicitudes de otro departamento', 403);
      }
    } else {
      // Colaborador u otros
      if (request.createdBy !== query.userId) {
        throw new BusinessError('No tienes permisos para consultar esta solicitud', 403);
      }
    }

    return request;
  }
}

module.exports = GetResourceRequestByIdHandler;
