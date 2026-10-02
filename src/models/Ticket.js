const TicketStatus = require('../enums/TicketStatus');

class Ticket {
  constructor({
    id,
    title,
    description,
    priority,
    department_id,
    status = TicketStatus.ABIERTO,
    created_by,
    assigned_to = null,
    resolution_notes = null,
    resolved_at = null,
    created_at,
    updated_at
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.department_id = department_id;
    this.status = status;
    this.created_by = created_by;
    this.assigned_to = assigned_to;
    this.resolution_notes = resolution_notes;
    this.resolved_at = resolved_at;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = Ticket;
