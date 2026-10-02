class GetTicketsByDepartmentQuery {
  /**
   * @param {{ ticketReadModel: import('../../contracts').ITicketReadModel }} deps
   */
  constructor({ ticketReadModel }) {
    this.ticketReadModel = ticketReadModel;
  }

  async execute(departmentId) {
    return await this.ticketReadModel.getTicketsByDepartment(departmentId);
  }
}

module.exports = GetTicketsByDepartmentQuery;
