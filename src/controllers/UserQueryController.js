const GetDepartmentSolversQuery = require('../queries/users/GetDepartmentSolversQuery');
const GetAllUsersQuery = require('../queries/users/GetAllUsersQuery'); // 1. Importar el Query DTO
const ResponseBuilder = require('../utils/responseBuilder');

const userQueryControllerFactory = ({
  getDepartmentSolversHandler,
  getAllUsersHandler // 2. Recibir el Handler inyectado
}) => ({
  // 3. Nuevo método para listar usuarios
  getAll: async (req, res, next) => {
    try {
      const query = new GetAllUsersQuery({
        role: req.query?.role ?? null,
        departmentId: req.query?.department_id ?? null,
        search: req.query?.search ?? null,
        page: req.query?.page !== undefined ? Number(req.query.page) : 1,
        limit: req.query?.limit !== undefined ? Number(req.query.limit) : 20
      });

      const data = await getAllUsersHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Usuarios obtenidos exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  getSolvers: async (req, res, next) => {
    try {
      const query = new GetDepartmentSolversQuery({
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null,
        departmentId: req.query?.department_id ?? null
      });

      const data = await getDepartmentSolversHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Solucionadores obtenidos exitosamente', 200);
    } catch (error) {
      next(error);
    }
  }
});

module.exports = userQueryControllerFactory;