const GetExpensesByUserQuery = require('../../application/queries/expenses/GetExpensesByUserQuery');
const GetPendingExpensesQuery = require('../../application/queries/expenses/GetPendingExpensesQuery');
const ExpenseReadModel = require('../../infrastructure/read_models/ExpenseReadModel');
const ResponseBuilder = require('../../utils/responseBuilder');

const expenseReadModel = new ExpenseReadModel();
const getExpensesByUserQuery = new GetExpensesByUserQuery(expenseReadModel);
const getPendingExpensesQuery = new GetPendingExpensesQuery(expenseReadModel);

class ExpenseQueryController {
  static async getMyExpenses(req, res, next) {
    try {
      const userId = req.user.id;
      const viewModels = await getExpensesByUserQuery.execute(userId);
      return ResponseBuilder.success(res, viewModels, 'Gastos para ViewModel Flutter obtenidos');
    } catch (error) {
      next(error);
    }
  }

  static async getPending(req, res, next) {
    try {
      const viewModels = await getPendingExpensesQuery.execute();
      return ResponseBuilder.success(res, viewModels, 'Gastos pendientes obtenidos');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ExpenseQueryController;
