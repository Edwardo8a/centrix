const BusinessError = require('../../exceptions/BusinessError');

class DeleteUserHandler {
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

    if (command.performedBy && command.performedBy === command.userId) {
      throw new BusinessError('No puedes eliminar tu propia cuenta de usuario', 400);
    }

    await this.userRepository.softDelete(command.userId);
    return { id: command.userId, deleted: true };
  }
}

module.exports = DeleteUserHandler;
