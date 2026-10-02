class TicketRepository {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  async create(ticketData) {
    const { data, error } = await this.supabase
      .from('tickets')
      .insert([{
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        status: ticketData.status,
        department_id: ticketData.department_id,
        created_by: ticketData.created_by
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = TicketRepository;
