const CreateExpenseUseCase = require('../../application/expenses/CreateExpenseUseCase');
const GetExpensesByUserUseCase = require('../../application/expenses/GetExpensesByUserUseCase');
const ExpenseRepository = require('../../infrastructure/repositories/ExpenseRepository');
const AuditService = require('../../infrastructure/services/AuditService');
const ResponseBuilder = require('../../utils/responseBuilder');

const expenseRepository = new ExpenseRepository();
const auditService = new AuditService();
const createExpenseUseCase = new CreateExpenseUseCase({ expenseRepository, auditService });
const getExpensesByUserUseCase = new GetExpensesByUserUseCase(expenseRepository);

class ExpenseController {
  static async create(req, res, next) {
    try {
      const { concept, amount, costCenter, date } = req.body;
      const userId = req.user.id;
      const expense = await createExpenseUseCase.execute({ concept, amount, costCenter, date, userId });
      return ResponseBuilder.success(res, expense, 'Gasto registrado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyExpenses(req, res, next) {
    try {
      const userId = req.user.id;
      const expenses = await getExpensesByUserUseCase.execute(userId);
      return ResponseBuilder.success(res, expenses, 'Gastos obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ExpenseController;
