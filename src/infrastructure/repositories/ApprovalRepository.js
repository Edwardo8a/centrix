const supabase = require('../db/supabaseClient');

class ApprovalRepository {
  async create(approvalData) {
    const { data, error } = await supabase
      .from('approvals')
      .insert([approvalData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = ApprovalRepository;
