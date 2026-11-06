class DeleteTicketCommand {
  constructor({ ticketId, userId, userRole = null, userDepartmentId = null }) {
    this.ticketId = ticketId;
    this.userId = userId;
    this.userRole = userRole;
    this.userDepartmentId = userDepartmentId;
    Object.freeze(this);
  }
}

module.exports = DeleteTicketCommand;
