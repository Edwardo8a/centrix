class GetExpensesByUserUseCase {
  constructor(expenseRepository) {
    this.expenseRepository = expenseRepository;
  }

  async execute(userId) {
    return await this.expenseRepository.findByUser(userId);
  }
}

module.exports = GetExpensesByUserUseCase;
