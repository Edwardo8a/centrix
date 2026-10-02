const supabase = require('../config/supabaseClient');

class TicketReadModel {
  /**
   * Obtiene lista de tickets estructurada para ViewModel de Flutter
   */
  async getTicketsByUserForViewModel(userId) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        priority,
        status,
        department_id,
        created_at,
        updated_at,
        creator:created_by (id, full_name, email),
        assignee:assigned_to (id, full_name, email)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(ticket => ({
      ticketId: ticket.id,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      departmentId: ticket.department_id,
      createdAtIso: ticket.created_at,
      updatedAtIso: ticket.updated_at,
      authorName: ticket.creator ? ticket.creator.full_name : 'Desconocido',
      assignedToName: ticket.assignee ? ticket.assignee.full_name : 'Sin asignar'
    }));
  }

  /**
   * Obtiene detalle de un ticket estructurado para ViewModel de Flutter
   */
  async getTicketByIdForViewModel(ticketId) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        priority,
        status,
        department_id,
        created_at,
        updated_at,
        creator:created_by (id, full_name, email),
        assignee:assigned_to (id, full_name, email),
        ticket_attachments (id, file_url, uploaded_at)
      `)
      .eq('id', ticketId)
      .single();

    if (error) throw error;

    return {
      ticketId: data.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      departmentId: data.department_id,
      createdAtIso: data.created_at,
      updatedAtIso: data.updated_at,
      author: {
        id: data.creator?.id,
        fullName: data.creator?.full_name,
        email: data.creator?.email
      },
      assignee: data.assignee ? {
        id: data.assignee.id,
        fullName: data.assignee.full_name,
        email: data.assignee.email
      } : null,
      attachments: (data.ticket_attachments || []).map(att => ({
        attachmentId: att.id,
        fileUrl: att.file_url,
        uploadedAt: att.uploaded_at
      }))
    };
  }

  /**
   * Obtiene tickets pendientes para la vista del Gerente
   */
  async getPendingTicketsForManager() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        priority,
        status,
        department_id,
        created_at,
        creator:created_by (id, full_name, email)
      `)
      .in('status', ['abierto', 'en_revision', 'Abierto', 'En revision'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(t => ({
      ticketId: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      departmentId: t.department_id,
      createdAtIso: t.created_at,
      requestedBy: t.creator?.full_name || 'Desconocido'
    }));
  }
}

module.exports = TicketReadModel;
