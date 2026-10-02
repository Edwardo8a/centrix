class CreateTicketCommand {
  constructor({ title, description, priority, departmentId, userId }) {
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.departmentId = departmentId;
    this.userId = userId;
  }
}

module.exports = CreateTicketCommand;
