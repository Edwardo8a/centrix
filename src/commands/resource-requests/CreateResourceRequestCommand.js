class CreateResourceRequestCommand {
  constructor({ title, description, category, estimatedAmount = null, departmentId, userId }) {
    this.title = title;
    this.description = description;
    this.category = category;
    this.estimatedAmount = estimatedAmount;
    this.departmentId = departmentId;
    this.userId = userId;
    Object.freeze(this);
  }
}

module.exports = CreateResourceRequestCommand;
