const UserRepository = require('../repositories/UserRepository');
const ManageUserCommand = require('../commands/admin/ManageUserCommand');
const ResponseBuilder = require('../utils/responseBuilder');

const userRepository = new UserRepository();
const manageUserCommand = new ManageUserCommand(userRepository);

class AdminController {
  // HU-11: Crear usuario en Auth y tabla personas/users
  static async createUser(req, res, next) {
    try {
      const userData = req.body;
      const newUser = await manageUserCommand.createUser(userData);
      return ResponseBuilder.success(res, newUser, 'Usuario creado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }

  // HU-12 / PPS-42: Asignar multiples roles a un usuario
  static async updateUserRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const { roles } = req.body;

      const result = await manageUserCommand.updateUserRoles(userId, roles);
      return ResponseBuilder.success(res, result, 'Roles del usuario actualizados correctamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
