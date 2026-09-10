const supabase = require('../db/supabaseClient');

class AuditService {
  async logAction(userId, action, tableAffected, recordId) {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: userId,
        action,
        table_affected: tableAffected,
        record_id: recordId,
        timestamp: new Date()
      }]);

    if (error) console.error('[AuditService] Failed to log action:', error.message);
  }
}

module.exports = AuditService;
