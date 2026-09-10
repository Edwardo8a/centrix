const supabase = require('../db/supabaseClient');

class TicketReadModel {
  /**
   * Obtiene lista de tickets estructurada directamente para Flutter TicketListViewModel
   */
  async getTicketsByUserForViewModel(userId) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        category,
        status,
        created_at,
        updated_at,
        creator:created_by (id, full_name, email),
        assignee:assigned_to (id, full_name, email)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // DTO adaptado para Flutter ViewModel
    return data.map(ticket => ({
      ticketId: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      status: ticket.status,
      createdAtIso: ticket.created_at,
      updatedAtIso: ticket.updated_at,
      authorName: ticket.creator ? ticket.creator.full_name : 'Desconocido',
      assignedToName: ticket.assignee ? ticket.assignee.full_name : 'Sin asignar'
    }));
  }

  /**
   * Obtiene detalle de un ticket estructurado para Flutter TicketDetailViewModel
   */
  async getTicketByIdForViewModel(ticketId) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        category,
        status,
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
      category: data.category,
      status: data.status,
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
   * Obtiene tickets pendientes para la vista del Gerente (ManagerTicketListViewModel)
   */
  async getPendingTicketsForManager() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        category,
        status,
        created_at,
        creator:created_by (id, full_name, email)
      `)
      .in('status', ['abierto', 'en_revision'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(t => ({
      ticketId: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      status: t.status,
      createdAtIso: t.created_at,
      requestedBy: t.creator?.full_name || 'Desconocido'
    }));
  }
}

module.exports = TicketReadModel;
