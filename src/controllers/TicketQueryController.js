const { getTicketsByDepartmentQuery } = require('../config/container');
const ResponseBuilder = require('../utils/responseBuilder');

class TicketQueryController {
  static async getByDepartment(req, res, next) {
    try {
      const { departmentId } = req.params;
      const data = await getTicketsByDepartmentQuery.execute(departmentId);
      return ResponseBuilder.success(res, data, 'Tickets del departamento obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TicketQueryController;
