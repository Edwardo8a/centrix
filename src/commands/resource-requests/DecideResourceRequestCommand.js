class DecideResourceRequestCommand {
  constructor({ requestId, decision, comment = null, userId, userRole, userDepartmentId }) {
    this.requestId = requestId;
    this.decision = decision; // 'Aprobada' | 'Rechazada'
    this.comment = comment;
    this.userId = userId;
    this.userRole = userRole;
    this.userDepartmentId = userDepartmentId;
    Object.freeze(this);
  }
}

module.exports = DecideResourceRequestCommand;
