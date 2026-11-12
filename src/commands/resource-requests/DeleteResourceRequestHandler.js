const UserRole = require('../../enums/UserRole');
const { ResourceRequestStatus } = require('../../enums/ResourceRequestStatus');
const BusinessError = require('../../exceptions/BusinessError');

class DeleteResourceRequestHandler {
  /**
   * @param {{ resourceRequestRepository: import('../../contracts').IResourceRequestRepository }} deps
   */
  constructor({ resourceRequestRepository }) {
    this.resourceRequestRepository = resourceRequestRepository;
  }

  async handle(command) {
    const existing = await this.resourceRequestRepository.findById(command.requestId);
    if (!existing) {
      throw new BusinessError('Solicitud de recurso no encontrada', 404);
    }

    if (command.userRole === UserRole.ADMINISTRADOR) {
      // Acceso total
    } else if (command.userRole === UserRole.GERENTE) {
      if (!command.userDepartmentId) {
        throw new BusinessError('El gerente no tiene un departamento asignado', 403);
      }
      if (existing.department_id !== command.userDepartmentId) {
        throw new BusinessError('No tienes permisos para eliminar solicitudes de otro departamento', 403);
      }
    } else {
      // Colaborador
      if (existing.created_by !== command.userId) {
        throw new BusinessError('No tienes permisos para eliminar esta solicitud', 403);
      }
      if (existing.status !== ResourceRequestStatus.PENDIENTE) {
        throw new BusinessError(
          `Solo se pueden eliminar solicitudes en estado "${ResourceRequestStatus.PENDIENTE}"`,
          409
        );
      }
    }

    await this.resourceRequestRepository.softDelete(command.requestId, command.userId);
    return { id: command.requestId, deleted: true };
  }
}

module.exports = DeleteResourceRequestHandler;
