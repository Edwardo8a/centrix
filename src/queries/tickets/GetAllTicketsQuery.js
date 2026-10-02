class GetAllTicketsQuery {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(departmentId) {
    return await this.ticketRepository.findAllByDepartment(departmentId);
  }
}

module.exports = GetAllTicketsQuery;
