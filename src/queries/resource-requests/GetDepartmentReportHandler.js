const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

class GetDepartmentReportHandler {
  /**
   * @param {{ budgetRepository: import('../../repositories/BudgetRepository') }} deps
   */
  constructor({ budgetRepository }) {
    this.budgetRepository = budgetRepository;
  }

  async handle(query) {
    const targetDeptId = query.departmentId || query.userDepartmentId;

    if (!targetDeptId) {
      throw new BusinessError('Se requiere un departamento para generar el reporte', 400);
    }

    if (query.userRole !== UserRole.ADMINISTRADOR && query.userDepartmentId !== targetDeptId) {
      throw new BusinessError('No tienes permisos para ver reportes de otro departamento', 403);
    }

    return await this.budgetRepository.getDepartmentReport(targetDeptId, query.year, query.month);
  }
}

module.exports = GetDepartmentReportHandler;
