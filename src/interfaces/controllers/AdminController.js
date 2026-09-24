const GetGlobalReportsQuery = require('../../application/queries/admin/GetGlobalReportsQuery');
const GetAuditLogsQuery = require('../../application/queries/admin/GetAuditLogsQuery');
const AdminReportReadModel = require('../../infrastructure/read_models/AdminReportReadModel');
const ResponseBuilder = require('../../utils/responseBuilder');
const UserRepository = require('../../infrastructure/repositories/UserRepository');
const ManageUserCommand = require('../../application/commands/admin/ManageUserCommand');

const adminReportReadModel = new AdminReportReadModel();
const getGlobalReportsQuery = new GetGlobalReportsQuery(adminReportReadModel);
const getAuditLogsQuery = new GetAuditLogsQuery(adminReportReadModel);

const userRepository = new UserRepository();
const manageUserCommand = new ManageUserCommand(userRepository);

class AdminController {
  static async createUser(req, res, next) {
    try {
      const userData = req.body;
      const newUser = await manageUserCommand.createUser(userData);
      return ResponseBuilder.success(res, newUser, 'Usuario creado correctamente');
    } catch (error) {
      next(error);
    }
  }

  static async getReports(req, res, next) {
    try {
      const reports = await getGlobalReportsQuery.execute();
      return ResponseBuilder.success(res, reports, 'Reportes globales para ViewModel obtenidos');
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const logs = await getAuditLogsQuery.execute(limit);
      return ResponseBuilder.success(res, logs, 'Logs de auditoría obtenidos');
    } catch (error) {
      next(error);
    }
  }
static async updateUserRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const { roles } = req.body;
      
      const result = await manageUserCommand.updateUserRoles(userId, roles);
      return ResponseBuilder.success(res, result, 'Roles del usuario actualizados correctamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
