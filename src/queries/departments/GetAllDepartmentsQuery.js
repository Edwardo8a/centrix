class GetAllDepartmentsQuery {
  /**
   * @param {{ departmentReadModel: import('../../contracts').IDepartmentReadModel }} deps
   */
  constructor({ departmentReadModel }) {
    this.departmentReadModel = departmentReadModel;
  }

  async execute() {
    return await this.departmentReadModel.getAll();
  }
}

module.exports = GetAllDepartmentsQuery;
