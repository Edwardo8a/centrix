class GetAuditLogsQuery {
  constructor(adminReportReadModel) {
    this.adminReportReadModel = adminReportReadModel;
  }

  async execute(limit = 50) {
    return await this.adminReportReadModel.getAuditLogsForViewModel(limit);
  }
}

module.exports = GetAuditLogsQuery;
