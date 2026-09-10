class UpdateExpenseStatusUseCase {
  constructor({ expenseRepository, auditService }) {
    this.expenseRepository = expenseRepository;
    this.auditService = auditService;
  }

  async execute(expenseId, status, approverId) {
    const updated = await this.expenseRepository.updateStatus(expenseId, status, approverId);
    if (this.auditService) {
      await this.auditService.logAction(approverId, 'UPDATE_EXPENSE_STATUS', 'expenses', expenseId);
    }
    return updated;
  }
}

module.exports = UpdateExpenseStatusUseCase;
