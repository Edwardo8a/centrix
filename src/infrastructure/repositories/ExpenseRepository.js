const supabase = require('../db/supabaseClient');

class ExpenseRepository {
  async create(expenseData) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async findByUser(userId) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('created_by', userId);
    if (error) throw error;
    return data;
  }

  async updateStatus(id, status, approverId) {
    const { data, error } = await supabase
      .from('expenses')
      .update({ status, approved_by: approverId, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = ExpenseRepository;
