const LoginCommand = require('../commands/auth/LoginCommand');
const UserRepository = require('../repositories/UserRepository');
const ResponseBuilder = require('../utils/responseBuilder');

const userRepository = new UserRepository();
const loginCommand = new LoginCommand(userRepository);

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await loginCommand.execute({ email, password });
      return ResponseBuilder.success(res, result, 'Inicio de sesion exitoso');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
