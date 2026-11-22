class CreateDepartmentCommand {
  constructor({ name, description = null }) {
    this.name = name;
    this.description = description;
    Object.freeze(this);
  }
}

module.exports = CreateDepartmentCommand;
