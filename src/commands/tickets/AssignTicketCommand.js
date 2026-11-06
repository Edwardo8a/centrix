class AssignTicketCommand {
  constructor({ ticketId, assignedTo, userId, userRole = null, userDepartmentId = null }) {
    this.ticketId = ticketId;
    this.assignedTo = assignedTo;
    this.userId = userId;
    this.userRole = userRole;
    this.userDepartmentId = userDepartmentId;
    Object.freeze(this);
  }
}

module.exports = AssignTicketCommand;

