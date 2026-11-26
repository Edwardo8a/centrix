const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

class GetDepartmentBudgetHandler {
  /**
   * @param {{ budgetRepository: import('../../repositories/BudgetRepository') }} deps
   */
  constructor({ budgetRepository }) {
    this.budgetRepository = budgetRepository;
  }

  async handle(query) {
    const targetDeptId = query.departmentId || query.userDepartmentId;

    if (!targetDeptId) {
      throw new BusinessError('Se requiere un departamento para consultar el presupuesto', 400);
    }

    if (query.userRole !== UserRole.ADMINISTRADOR && query.userDepartmentId !== targetDeptId) {
      throw new BusinessError('No tienes permisos para ver el presupuesto de otro departamento', 403);
    }

    return await this.budgetRepository.getDepartmentBudget(targetDeptId, query.year, query.month);
  }
}

module.exports = GetDepartmentBudgetHandler;
