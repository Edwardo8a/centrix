const GetMyResourceRequestsQuery = require('../queries/resource-requests/GetMyResourceRequestsQuery');
const GetResourceRequestsByDepartmentQuery = require('../queries/resource-requests/GetResourceRequestsByDepartmentQuery');
const GetResourceRequestByIdQuery = require('../queries/resource-requests/GetResourceRequestByIdQuery');
const GetDepartmentBudgetQuery = require('../queries/resource-requests/GetDepartmentBudgetQuery');
const GetDepartmentReportQuery = require('../queries/resource-requests/GetDepartmentReportQuery');
const ResponseBuilder = require('../utils/responseBuilder');

const resourceRequestQueryControllerFactory = ({
  getMyResourceRequestsHandler,
  getResourceRequestsByDepartmentHandler,
  getResourceRequestByIdHandler,
  getDepartmentBudgetHandler,
  getDepartmentReportHandler
}) => ({
  getMine: async (req, res, next) => {
    try {
      const query = new GetMyResourceRequestsQuery({
        userId: req.user.id
      });

      const data = await getMyResourceRequestsHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Mis solicitudes de recursos obtenidas exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  getByDepartment: async (req, res, next) => {
    try {
      const query = new GetResourceRequestsByDepartmentQuery({
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null,
        departmentId: req.query?.department_id ?? null,
        status: req.query?.status ?? null,
        category: req.query?.category ?? null,
        search: req.query?.search ?? null,
        month: req.query?.month ?? null,
        year: req.query?.year ?? null,
        page: req.query?.page !== undefined ? Number(req.query.page) : 1,
        limit: req.query?.limit !== undefined ? Number(req.query.limit) : 20
      });

      const data = await getResourceRequestsByDepartmentHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Solicitudes de recursos del departamento obtenidas exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const query = new GetResourceRequestByIdQuery({
        requestId: req.params.id,
        userId: req.user.id,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const data = await getResourceRequestByIdHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Detalle de la solicitud de recurso obtenido exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  getBudget: async (req, res, next) => {
    try {
      const query = new GetDepartmentBudgetQuery({
        departmentId: req.query?.department_id ?? null,
        year: req.query?.year ?? null,
        month: req.query?.month ?? null,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const data = await getDepartmentBudgetHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Presupuesto del departamento obtenido exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  getReport: async (req, res, next) => {
    try {
      const query = new GetDepartmentReportQuery({
        departmentId: req.query?.department_id ?? null,
        year: req.query?.year ?? null,
        month: req.query?.month ?? null,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const data = await getDepartmentReportHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Reporte del departamento obtenido exitosamente', 200);
    } catch (error) {
      next(error);
    }
  }
});

module.exports = resourceRequestQueryControllerFactory;
