const BusinessError = require('../../exceptions/BusinessError');

class UpdateUserHandler {
  /**
   * @param {{ userRepository: import('../../contracts').IUserRepository }} deps
   */
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async handle(command) {
    const existing = await this.userRepository.findById(command.userId);
    if (!existing) {
      throw new BusinessError('Usuario no encontrado', 404);
    }

    const updated = await this.userRepository.update(command.userId, {
      nombre: command.nombre,
      apellido_pat: command.apellido_pat,
      apellido_mat: command.apellido_mat,
      tel: command.tel,
      departmentId: command.departmentId,
      role: command.role
    });

    return {
      id: updated.id,
      nombre: updated.full_name,
      apellido_pat: updated.apellido_pat,
      apellido_mat: updated.apellido_mat,
      tel: updated.tel,
      departmentId: updated.department_id
    };
  }
}

module.exports = UpdateUserHandler;
