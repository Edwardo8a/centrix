class GetAllDepartmentsHandler {
  /**
   * @param {{ departmentReadModel: import('../../contracts').IDepartmentReadModel }} deps
   */
  constructor({ departmentReadModel }) {
    this.departmentReadModel = departmentReadModel;
  }

  async handle(_query = null) {
    return await this.departmentReadModel.getAll();
  }
}

module.exports = GetAllDepartmentsHandler;
