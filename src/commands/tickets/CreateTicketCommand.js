class CreateTicketCommand {
  constructor({ title, description, priority, departmentId, userId }) {
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.departmentId = departmentId;
    this.userId = userId;
    Object.freeze(this);
  }
}

module.exports = CreateTicketCommand;
