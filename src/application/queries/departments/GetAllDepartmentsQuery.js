class GetAllDepartmentsQuery {
  constructor({ departmentRepository }) {
    this.departmentRepository = departmentRepository;
  }

  async execute() {
    return await this.departmentRepository.getAllDepartments();
  }
}

module.exports = GetAllDepartmentsQuery;
