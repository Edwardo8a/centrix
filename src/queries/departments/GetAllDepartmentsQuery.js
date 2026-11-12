class GetAllDepartmentsQuery {
  /**
   * DTO de consulta para obtener todos los departamentos.
   * Mantiene compatibilidad hacia atrás en caso de instanciarse con departmentReadModel.
   * @param {{ departmentReadModel?: import('../../contracts').IDepartmentReadModel }} [deps]
   */
  constructor({ departmentReadModel } = {}) {
    this.departmentReadModel = departmentReadModel || null;
    Object.freeze(this);
  }

  // Compatibilidad hacia atrás con tests existentes
  async execute() {
    if (this.departmentReadModel && typeof this.departmentReadModel.getAll === 'function') {
      return await this.departmentReadModel.getAll();
    }
    return [];
  }
}

module.exports = GetAllDepartmentsQuery;
