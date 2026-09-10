const CreateExpenseCommand = require('../../application/commands/expenses/CreateExpenseCommand');
const UpdateExpenseStatusCommand = require('../../application/commands/expenses/UpdateExpenseStatusCommand');
const ExpenseRepository = require('../../infrastructure/repositories/ExpenseRepository');
const AuditService = require('../../infrastructure/services/AuditService');
const ResponseBuilder = require('../../utils/responseBuilder');

const expenseRepository = new ExpenseRepository();
const auditService = new AuditService();

const createExpenseCommand = new CreateExpenseCommand({ expenseRepository, auditService });
const updateExpenseStatusCommand = new UpdateExpenseStatusCommand({ expenseRepository, auditService });

class ExpenseCommandController {
  static async create(req, res, next) {
    try {
      const { concept, amount, costCenter, date } = req.body;
      const userId = req.user.id;
      const expense = await createExpenseCommand.execute({ concept, amount, costCenter, date, userId });
      return ResponseBuilder.success(res, expense, 'Gasto registrado exitosamente (ACID Command)', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { expenseId } = req.params;
      const { status, comment } = req.body;
      const approverId = req.user.id;
      const updated = await updateExpenseStatusCommand.execute({ expenseId, status, approverId, comment });
      return ResponseBuilder.success(res, updated, 'Estado del gasto actualizado exitosamente (ACID Transaction)');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ExpenseCommandController;
