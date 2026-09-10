const TicketStatus = require('../enums/TicketStatus');

class Ticket {
  constructor({ id, title, description, category, status = TicketStatus.ABIERTO, createdBy, assignedTo, createdAt, updatedAt }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.category = category;
    this.status = status;
    this.createdBy = createdBy;
    this.assignedTo = assignedTo;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = Ticket;
