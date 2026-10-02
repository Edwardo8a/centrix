const { getAllDepartmentsQuery } = require('../config/container');
const ResponseBuilder = require('../utils/responseBuilder');

class DepartmentQueryController {
  static async getAll(req, res, next) {
    try {
      const data = await getAllDepartmentsQuery.execute();
      return ResponseBuilder.success(res, data, 'Departamentos obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DepartmentQueryController;
