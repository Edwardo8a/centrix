const supabase = require('../../../infrastructure/db/supabaseClient');

class UpdateExpenseStatusCommand {
  constructor({ expenseRepository, auditService }) {
    this.expenseRepository = expenseRepository;
    this.auditService = auditService;
  }

  async execute({ expenseId, status, approverId, comment = '' }) {
    // Intenta ejecutar vía función almacenada RPC para garantizar ACID estricto
    try {
      const { data, error } = await supabase.rpc('update_expense_status_transaction', {
        p_expense_id: expenseId,
        p_status: status,
        p_approver_id: approverId,
        p_comment: comment
      });

      if (!error && data) return data;
    } catch (rpcErr) {
      console.warn('[UpdateExpenseStatusCommand] RPC fallback:', rpcErr.message);
    }

    const updated = await this.expenseRepository.updateStatus(expenseId, status, approverId);
    if (this.auditService) {
      await this.auditService.logAction(approverId, `UPDATE_EXPENSE_${status.toUpperCase()}`, 'expenses', expenseId);
    }
    return updated;
  }
}

module.exports = UpdateExpenseStatusCommand;
