const supabase = require('../db/supabaseClient');

class TicketRepository {
  async create(ticketData) {
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async findByUser(userId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('created_by', userId);
    if (error) throw error;
    return data;
  }

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = TicketRepository;
