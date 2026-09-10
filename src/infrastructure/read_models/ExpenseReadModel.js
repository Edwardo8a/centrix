const supabase = require('../db/supabaseClient');

class ExpenseReadModel {
  /**
   * Obtiene lista de gastos estructurada para Flutter ExpenseListViewModel
   */
  async getExpensesByUserForViewModel(userId) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        id,
        concept,
        amount,
        cost_center,
        date,
        status,
        created_at,
        approver:approved_by (id, full_name),
        expense_receipts (id, file_url)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(e => ({
      expenseId: e.id,
      concept: e.concept,
      amount: parseFloat(e.amount),
      costCenter: e.cost_center,
      dateIso: e.date,
      status: e.status,
      approvedByName: e.approver ? e.approver.full_name : null,
      receiptsCount: (e.expense_receipts || []).length,
      receiptUrls: (e.expense_receipts || []).map(r => r.file_url)
    }));
  }

  /**
   * Obtiene gastos pendientes para Flutter ManagerExpenseApprovalViewModel
   */
  async getPendingExpensesForManager() {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        id,
        concept,
        amount,
        cost_center,
        date,
        status,
        creator:created_by (id, full_name, email),
        expense_receipts (id, file_url)
      `)
      .eq('status', 'pendiente')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(e => ({
      expenseId: e.id,
      concept: e.concept,
      amount: parseFloat(e.amount),
      costCenter: e.cost_center,
      dateIso: e.date,
      status: e.status,
      applicantName: e.creator?.full_name || 'Desconocido',
      applicantEmail: e.creator?.email || '',
      receipts: (e.expense_receipts || []).map(r => r.file_url)
    }));
  }
}

module.exports = ExpenseReadModel;
