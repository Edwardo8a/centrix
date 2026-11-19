const GetAllDepartmentsQuery = require('../queries/departments/GetAllDepartmentsQuery');
const ResponseBuilder = require('../utils/responseBuilder');

const departmentQueryControllerFactory = ({ getAllDepartmentsHandler }) => ({
  getAll: async (req, res, next) => {
    try {
      const query = new GetAllDepartmentsQuery();
      const data = typeof getAllDepartmentsHandler?.handle === 'function'
        ? await getAllDepartmentsHandler.handle(query)
        : await getAllDepartmentsHandler?.execute();

      return ResponseBuilder.success(res, data, 'Departamentos obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }
});

module.exports = departmentQueryControllerFactory;
