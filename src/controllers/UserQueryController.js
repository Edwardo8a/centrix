const GetDepartmentSolversQuery = require('../queries/users/GetDepartmentSolversQuery');
const ResponseBuilder = require('../utils/responseBuilder');

const userQueryControllerFactory = ({
  getDepartmentSolversHandler
}) => ({
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

