class GetPendingExpensesQuery {
  constructor(expenseReadModel) {
    this.expenseReadModel = expenseReadModel;
  }

  async execute() {
    return await this.expenseReadModel.getPendingExpensesForManager();
  }
}

module.exports = GetPendingExpensesQuery;
