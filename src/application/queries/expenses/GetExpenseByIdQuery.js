class GetExpenseByIdQuery {
  constructor(expenseReadModel) {
    this.expenseReadModel = expenseReadModel;
  }

  async execute(expenseId) {
    // Stub query execution for single expense by ID
    return { expenseId };
  }
}

module.exports = GetExpenseByIdQuery;
