const DepartmentRepository = require('../../infrastructure/repositories/DepartmentRepository');
const GetAllDepartmentsQuery = require('../../application/queries/departments/GetAllDepartmentsQuery');
const ResponseBuilder = require('../../utils/responseBuilder');

const departmentRepository = new DepartmentRepository();
const getAllDepartmentsQuery = new GetAllDepartmentsQuery({ departmentRepository });

class DepartmentQueryController {
  static async getAll(req, res, next) {
    try {
      const departments = await getAllDepartmentsQuery.execute();
      return ResponseBuilder.success(res, departments, 'Departamentos obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DepartmentQueryController;
