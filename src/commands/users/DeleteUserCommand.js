class DeleteUserCommand {
  constructor({ userId, performedBy = null }) {
    this.userId = userId;
    this.performedBy = performedBy;
    Object.freeze(this);
  }
}

module.exports = DeleteUserCommand;
