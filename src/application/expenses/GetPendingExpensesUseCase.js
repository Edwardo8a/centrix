class GetPendingExpensesUseCase {
  constructor(expenseRepository) {
    this.expenseRepository = expenseRepository;
  }

  async execute() {
    return [];
  }
}

module.exports = GetPendingExpensesUseCase;
