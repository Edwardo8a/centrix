const Ticket = require('../../models/Ticket');

class CreateTicketHandler {
  /**
   * @param {{ ticketRepository: import('../../contracts').ITicketRepository }} deps
   */
  constructor({ ticketRepository }) {
    this.ticketRepository = ticketRepository;
  }

  async handle(command) {
    const ticket = new Ticket({
      title: command.title,
      description: command.description,
      priority: command.priority,
      department_id: command.departmentId,
      created_by: command.userId
    });

    const result = await this.ticketRepository.create(ticket);
    return { id: result.id };
  }
}

module.exports = CreateTicketHandler;
