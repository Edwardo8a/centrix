class GetExpensesByUserQuery {
  constructor(expenseReadModel) {
    this.expenseReadModel = expenseReadModel;
  }

  async execute(userId) {
    return await this.expenseReadModel.getExpensesByUserForViewModel(userId);
  }
}

module.exports = GetExpensesByUserQuery;
