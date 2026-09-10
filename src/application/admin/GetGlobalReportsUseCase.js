class GetGlobalReportsUseCase {
  async execute() {
    return {
      totalTickets: 0,
      totalExpenses: 0,
      approvedExpensesAmount: 0
    };
  }
}

module.exports = GetGlobalReportsUseCase;
