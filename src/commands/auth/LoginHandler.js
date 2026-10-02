const BusinessError = require('../../exceptions/BusinessError');

class LoginHandler {
  /**
   * @param {{ authService: import('../../contracts').IAuthService, userReadModel: import('../../contracts').IUserReadModel, tokenService: import('../../contracts').ITokenService }} deps
   */
  constructor({ authService, userReadModel, tokenService }) {
    this.authService = authService;
    this.userReadModel = userReadModel;
    this.tokenService = tokenService;
  }

  async handle(command) {
    const { authId } = await this.authService.signIn(command.email, command.password);

    const user = await this.userReadModel.findById(authId);
    if (!user) {
      throw new BusinessError('Usuario no encontrado en la base de datos', 404);
    }

    const token = this.tokenService.generateToken({
      id: user.id,
      email: command.email,
      role: user.role,
      roles: user.roles
    });

    const fullName = `${user.nombre} ${user.apellido_pat || ''} ${user.apellido_mat || ''}`.trim();

    return {
      user: {
        id: user.id,
        email: command.email,
        fullName: fullName,
        role: user.role,
        roles: user.roles,
        tel: user.tel
      },
      token
    };
  }
}

module.exports = LoginHandler;
