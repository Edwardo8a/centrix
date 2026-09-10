const Expense = require('../../core/entities/Expense');

class CreateExpenseUseCase {
  constructor({ expenseRepository, auditService }) {
    this.expenseRepository = expenseRepository;
    this.auditService = auditService;
  }

  async execute({ concept, amount, costCenter, date, userId }) {
    const expense = new Expense({
      concept,
      amount,
      costCenter,
      date,
      createdBy: userId
    });

    const createdExpense = await this.expenseRepository.create({
      concept: expense.concept,
      amount: expense.amount,
      cost_center: expense.costCenter,
      date: expense.date,
      status: expense.status,
      created_by: expense.createdBy
    });

    if (this.auditService) {
      await this.auditService.logAction(userId, 'CREATE_EXPENSE', 'expenses', createdExpense.id);
    }

    return createdExpense;
  }
}

module.exports = CreateExpenseUseCase;
