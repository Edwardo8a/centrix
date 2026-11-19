const GetTicketsByDepartmentQuery = require('../queries/tickets/GetTicketsByDepartmentQuery');
const GetMyTicketsQuery = require('../queries/tickets/GetMyTicketsQuery');
const GetAssignedTicketsQuery = require('../queries/tickets/GetAssignedTicketsQuery');
const GetAllTicketsQuery = require('../queries/tickets/GetAllTicketsQuery');
const GetTicketByIdQuery = require('../queries/tickets/GetTicketByIdQuery');
const ResponseBuilder = require('../utils/responseBuilder');

const ticketQueryControllerFactory = ({
  getTicketsByDepartmentHandler,
  getMyTicketsHandler,
  getAssignedTicketsHandler,
  getAllTicketsHandler,
  getTicketByIdHandler
}) => ({
  getAll: async (req, res, next) => {
    try {
      const query = new GetAllTicketsQuery({
        status: req.query?.status ?? null,
        departmentId: req.query?.department_id ?? null,
        priority: req.query?.priority ?? null,
        page: req.query?.page !== undefined ? Number(req.query.page) : 1,
        limit: req.query?.limit !== undefined ? Number(req.query.limit) : 20
      });

      const data = await getAllTicketsHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Tickets obtenidos exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const query = new GetTicketByIdQuery({
        ticketId: req.params.id,
        userId: req.user.id,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const data = await getTicketByIdHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Detalle del ticket obtenido exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  getByDepartment: async (req, res, next) => {
    try {
      const query = new GetTicketsByDepartmentQuery({
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null,
        departmentId: req.query?.department_id ?? null
      });

      const data = await getTicketsByDepartmentHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Tickets del departamento obtenidos exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  getMine: async (req, res, next) => {
    try {
      const query = new GetMyTicketsQuery({
        userId: req.user.id
      });

      const data = await getMyTicketsHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Mis tickets obtenidos exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  getAssigned: async (req, res, next) => {
    try {
      const query = new GetAssignedTicketsQuery({
        userId: req.user.id
      });

      const data = await getAssignedTicketsHandler.handle(query);
      return ResponseBuilder.success(res, data, 'Tickets asignados obtenidos exitosamente', 200);
    } catch (error) {
      next(error);
    }
  }
});

module.exports = ticketQueryControllerFactory;
