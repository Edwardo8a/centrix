class ChangeTicketStatusCommand {
  constructor({ ticketId, newStatus, comment, userId, userRole = null, userDepartmentId = null }) {
    this.ticketId = ticketId;
    this.newStatus = newStatus;
    this.comment = comment;
    this.userId = userId;
    this.userRole = userRole;
    this.userDepartmentId = userDepartmentId;
    Object.freeze(this);
  }
}

module.exports = ChangeTicketStatusCommand;
