class CreateUserHandler {
  /**
   * @param {{ authService: import('../../contracts').IAuthService, userRepository: import('../../contracts').IUserRepository }} deps
   */
  constructor({ authService, userRepository }) {
    this.authService = authService;
    this.userRepository = userRepository;
  }

  async handle(command) {
    const { authId } = await this.authService.signUp(command.email, command.password);

    try {
      const user = await this.userRepository.create({
        nombre: command.nombre,
        apellido_pat: command.apellido_pat,
        apellido_mat: command.apellido_mat,
        tel: command.tel,
        email: command.email
      }, authId);
      
      return { id: user.id };
    } catch (err) {
      try {
        await this.authService.deleteUser(authId);
      } catch (deleteErr) {
        console.error('Error al intentar eliminar el usuario en Auth tras fallo en base de datos:', deleteErr);
      }
      throw err;
    }
  }
}

module.exports = CreateUserHandler;
