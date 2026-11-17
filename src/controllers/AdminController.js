const CreateUserCommand = require('../commands/admin/CreateUserCommand');
const { createUserHandler } = require('../config/container');
const ResponseBuilder = require('../utils/responseBuilder');

class AdminController {
  static async getRoles(req, res, next) {
    try {
      const { userRepository } = require('../config/container');
      return ResponseBuilder.success(res, await userRepository.getRoles(), 'Roles disponibles');
    } catch (error) { next(error); }
  }

  static async createUser(req, res, next) {
    try {
      const command = new CreateUserCommand({
        email: req.body.email,
        password: req.body.password,
        nombre: req.body.nombre,
        apellido_pat: req.body.apellido_pat,
        apellido_mat: req.body.apellido_mat,
        tel: req.body.tel,
        role: req.body.role,
        department_id: req.body.department_id
      });
      const result = await createUserHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Usuario creado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
