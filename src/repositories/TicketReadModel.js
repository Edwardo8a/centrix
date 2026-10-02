class TicketReadModel {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  async getTicketsByDepartment(departmentId) {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        priority,
        status,
        department_id,
        created_at,
        creator:created_by (id, full_name),
        assignee:assigned_to (id, full_name)
      `)
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST201' || (error.message && error.message.includes('ambiguous'))) {
        // En caso de que se presente el error de ambigüedad si se añaden más relaciones
        console.error('Ambiguous relation detected', error);
      }
      throw error;
    }

    return data.map(ticket => ({
      ticketId: ticket.id,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      departmentId: ticket.department_id,
      createdAtIso: ticket.created_at,
      authorName: ticket.creator ? ticket.creator.full_name : 'Desconocido',
      assignedToName: ticket.assignee ? ticket.assignee.full_name : 'Sin asignar'
    }));
  }
}

module.exports = TicketReadModel;
