const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

class UpdateDepartmentBudgetHandler {
  /**
   * @param {{ budgetRepository: import('../../repositories/BudgetRepository') }} deps
   */
  constructor({ budgetRepository }) {
    this.budgetRepository = budgetRepository;
  }

  async handle(command) {
    const targetDeptId = command.departmentId || command.userDepartmentId;

    if (!targetDeptId) {
      throw new BusinessError('Se requiere un departamento para ajustar el presupuesto', 400);
    }

    if (command.userRole !== UserRole.ADMINISTRADOR && command.userDepartmentId !== targetDeptId) {
      throw new BusinessError('No tienes permisos para modificar el presupuesto de otro departamento', 403);
    }

    if (!command.allocations || typeof command.allocations !== 'object') {
      throw new BusinessError('Las asignaciones de presupuesto son requeridas', 400);
    }

    // Validar que cada valor sea mayor a 0 y cubra lo ya gastado
    const current = await this.budgetRepository.getDepartmentBudget(targetDeptId, command.year, command.month);
    for (const cat of current.categories) {
      const newAlloc = command.allocations[cat.category];
      if (newAlloc !== undefined) {
        if (typeof newAlloc !== 'number' || newAlloc <= 0) {
          throw new BusinessError(`El monto para "${cat.category}" debe ser mayor a 0`, 400);
        }
        if (newAlloc < cat.spentCents) {
          throw new BusinessError(
            `El monto para "${cat.category}" ($${(newAlloc / 100).toFixed(2)}) no puede ser menor a lo ya ejercido ($${(cat.spentCents / 100).toFixed(2)})`,
            400
          );
        }
      }
    }

    await this.budgetRepository.updateAllocations(targetDeptId, command.year, command.month, command.allocations);
    return await this.budgetRepository.getDepartmentBudget(targetDeptId, command.year, command.month);
  }
}

module.exports = UpdateDepartmentBudgetHandler;
