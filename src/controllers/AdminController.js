const CreateUserCommand = require('../commands/admin/CreateUserCommand');
const UpdateUserCommand = require('../commands/users/UpdateUserCommand');
const DeleteUserCommand = require('../commands/users/DeleteUserCommand');
const ResponseBuilder = require('../utils/responseBuilder');

const adminControllerFactory = ({
  createUserHandler,
  updateUserHandler,
  deleteUserHandler
}) => ({
  createUser: async (req, res, next) => {
    try {
      const command = new CreateUserCommand({
        email: req.body.email,
        password: req.body.password,
        nombre: req.body.nombre,
        apellido_pat: req.body.apellido_pat,
        apellido_mat: req.body.apellido_mat,
        tel: req.body.tel
      });
      const result = await createUserHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Usuario creado correctamente', 201);
    } catch (error) {
      next(error);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const command = new UpdateUserCommand({
        userId: req.params.id,
        nombre: req.body.nombre,
        apellido_pat: req.body.apellido_pat,
        apellido_mat: req.body.apellido_mat,
        tel: req.body.tel,
        departmentId: req.body.department_id,
        role: req.body.role
      });
      const result = await updateUserHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Usuario actualizado correctamente', 200);
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const command = new DeleteUserCommand({
        userId: req.params.id,
        performedBy: req.user?.id
      });
      const result = await deleteUserHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Usuario eliminado correctamente', 200);
    } catch (error) {
      next(error);
    }
  }
});

module.exports = adminControllerFactory;
