const BusinessError = require('../exceptions/BusinessError');

class TicketRepository {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  async create(ticketData) {
    const { data, error } = await this.supabase
      .from('tickets')
      .insert({
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        status: ticketData.status,
        department_id: ticketData.department_id,
        created_by: ticketData.created_by
      })
      .select('id')
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async softDelete(ticketId, userId) {
    const { data, error } = await this.supabase
      .from('tickets')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .eq('id', ticketId)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateStatus({ ticketId, userId, newStatus, previousStatus, comment }) {
    const { data, error } = await this.supabase.rpc('update_ticket_status_transactional', {
      p_ticket_id: ticketId,
      p_user_id: userId,
      p_new_status: newStatus,
      p_expected_status: previousStatus,
      p_comment: comment || null
    });

    if (error) {
      if (error.code === 'P0002' || (error.message && error.message.includes('P0002'))) {
        throw new BusinessError('Ticket no encontrado', 404);
      }
      if (
        error.code === 'P0003' ||
        (error.message && error.message.includes('P0003')) ||
        (error.message && error.message.includes('cambio de estado'))
      ) {
        throw new BusinessError('El ticket cambió de estado, vuelve a intentarlo', 409);
      }
      throw error;
    }

    return data;
  }

  async assign({ ticketId, assignedTo, userId, comment }) {
    const { data, error } = await this.supabase.rpc('assign_ticket_transactional', {
      p_ticket_id: ticketId,
      p_assigned_to: assignedTo,
      p_user_id: userId,
      p_comment: comment
    });

    if (error) {
      if (error.code === 'P0002' || (error.message && error.message.includes('P0002'))) {
        throw new BusinessError('Ticket no encontrado', 404);
      }
      if (
        error.code === 'P0003' ||
        (error.message && error.message.includes('P0003')) ||
        (error.message && error.message.includes('ya se encuentra asignado'))
      ) {
        throw new BusinessError('El ticket ya se encuentra asignado a este usuario', 409);
      }
      throw error;
    }

    return data;
  }

  async addAttachment({ ticketId, fileUrl, fileFormat, sizeBytes }) {
    const { data, error } = await this.supabase
      .from('ticket_attachments')
      .insert({
        ticket_id: ticketId,
        file_url: fileUrl,
        file_format: fileFormat,
        size_bytes: sizeBytes
      })
      .select('id')
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = TicketRepository;
