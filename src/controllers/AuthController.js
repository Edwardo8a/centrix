const LoginCommand = require('../commands/auth/LoginCommand');
const { loginHandler } = require('../config/container');
const ResponseBuilder = require('../utils/responseBuilder');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const command = new LoginCommand({ email, password });
      const result = await loginHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Inicio de sesion exitoso');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
