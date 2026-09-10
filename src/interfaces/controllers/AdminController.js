const GetGlobalReportsQuery = require('../../application/queries/admin/GetGlobalReportsQuery');
const GetAuditLogsQuery = require('../../application/queries/admin/GetAuditLogsQuery');
const AdminReportReadModel = require('../../infrastructure/read_models/AdminReportReadModel');
const ResponseBuilder = require('../../utils/responseBuilder');

const adminReportReadModel = new AdminReportReadModel();
const getGlobalReportsQuery = new GetGlobalReportsQuery(adminReportReadModel);
const getAuditLogsQuery = new GetAuditLogsQuery(adminReportReadModel);

class AdminController {
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
}

module.exports = AdminController;
