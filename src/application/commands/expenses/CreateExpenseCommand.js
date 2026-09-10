const Expense = require('../../../core/entities/Expense');

class CreateExpenseCommand {
  constructor({ expenseRepository, auditService }) {
    this.expenseRepository = expenseRepository;
    this.auditService = auditService;
  }

  async execute({ concept, amount, costCenter, date, userId }) {
    const expenseEntity = new Expense({ concept, amount, costCenter, date, createdBy: userId });

    const createdExpense = await this.expenseRepository.create({
      concept: expenseEntity.concept,
      amount: expenseEntity.amount,
      cost_center: expenseEntity.costCenter,
      date: expenseEntity.date,
      status: expenseEntity.status,
      created_by: userId
    });

    if (this.auditService) {
      await this.auditService.logAction(userId, 'CREATE_EXPENSE', 'expenses', createdExpense.id);
    }

    return createdExpense;
  }
}

module.exports = CreateExpenseCommand;
