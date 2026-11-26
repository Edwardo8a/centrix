const Department = require('../../models/Department');

class CreateDepartmentHandler {
  /**
   * @param {{ departmentRepository: import('../../contracts').IDepartmentRepository }} deps
   */
  constructor({ departmentRepository }) {
    this.departmentRepository = departmentRepository;
  }

  async handle(command) {
    const department = new Department({
      name: command.name,
      description: command.description
    });
    const created = await this.departmentRepository.create(department);

    return {
      departmentId: created.id,
      name: created.name,
      description: created.description
    };
  }
}

module.exports = CreateDepartmentHandler;
