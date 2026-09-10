const supabase = require('../db/supabaseClient');

class AdminReportReadModel {
  /**
   * Obtiene métricas estructuradas para Flutter AdminDashboardViewModel
   */
  async getDashboardSummaryForViewModel() {
    const { count: totalTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true });
    const { count: totalExpenses } = await supabase.from('expenses').select('*', { count: 'exact', head: true });
    
    const { data: approvedExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('status', 'aprobado');

    const totalApprovedAmount = (approvedExpenses || []).reduce((acc, item) => acc + parseFloat(item.amount || 0), 0);

    return {
      totalTickets: totalTickets || 0,
      totalExpenses: totalExpenses || 0,
      totalApprovedExpensesAmount: totalApprovedAmount
    };
  }

  /**
   * Obtiene logs de auditoría para Flutter AuditLogsViewModel
   */
  async getAuditLogsForViewModel(limit = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        table_affected,
        record_id,
        timestamp,
        user:user_id (id, full_name, email)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(log => ({
      logId: log.id,
      action: log.action,
      tableAffected: log.table_affected,
      recordId: log.record_id,
      timestampIso: log.timestamp,
      performedBy: log.user ? log.user.full_name : 'Sistema'
    }));
  }
}

module.exports = AdminReportReadModel;
