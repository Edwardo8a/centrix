class GetGlobalReportsQuery {
  constructor(adminReportReadModel) {
    this.adminReportReadModel = adminReportReadModel;
  }

  async execute() {
    return await this.adminReportReadModel.getDashboardSummaryForViewModel();
  }
}

module.exports = GetGlobalReportsQuery;
