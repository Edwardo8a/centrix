const supabase = require('../db/supabaseClient');

class TicketRepository {
  // Crea un nuevo registro de ticket
  async create(ticketData) {
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Busca un ticket por su identificador unico
  async findById(id) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  // Obtiene todos los tickets asignados a un departamento
  async findAllByDepartment(departmentId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('department_id', departmentId);
    if (error) throw error;
    return data;
  }

  // Obtiene los tickets creados por un usuario especifico
  async findByUser(userId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('created_by', userId);
    if (error) throw error;
    return data;
  }

  // Actualiza el estado de un ticket y la fecha de modificacion
  async updateStatus(id, status) {
    // Se intenta actualizar con el nombre de columna status (modelo actual en produccion)
    let { data, error } = await supabase
      .from('tickets')
      .update({ status: status, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    // En caso de que el esquema haya sido migrado a nombres en espanol (columna estado)
    if (error && error.message && error.message.includes('column "status" of relation "tickets" does not exist')) {
      const fallbackResult = await supabase
        .from('tickets')
        .update({ estado: status, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (fallbackResult.error) throw fallbackResult.error;
      data = fallbackResult.data;
    } else if (error) {
      throw error;
    }

    return data;
  }

  // Registra un cambio de estado en la tabla de historial de auditoria
  async recordStatusHistory({ ticketId, userId, previousStatus, newStatus, comment }) {
    // 1. Intento principal con la tabla de historial existente en el esquema activo
    const payloadEnglish = {
      ticket_id: ticketId,
      user_id: userId,
      previous_status: previousStatus,
      new_status: newStatus,
      comment: comment || null
    };

    const { data, error } = await supabase
      .from('ticket_status_history')
      .insert([payloadEnglish])
      .select()
      .single();

    if (error) {
      // 2. Intento de respaldo si la tabla fue migrada con nombres en espanol
      const payloadSpanish = {
        id_ticket: ticketId,
        id_usuario: userId,
        estado_anterior: previousStatus,
        estado_nuevo: newStatus,
        comentario: comment || null
      };

      const fallback = await supabase
        .from('ticket_historial_estados')
        .insert([payloadSpanish])
        .select()
        .single();

      if (fallback.error) {
        console.error('[TicketRepository] No fue posible registrar historial de estado:', fallback.error.message);
      } else {
        return fallback.data;
      }
    }

    return data;
  }

  // Asigna un ticket a un usuario de soporte o tecnico responsable
  async assign(ticketId, assigneeId) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ assigned_to: assigneeId, updated_at: new Date() })
      .eq('id', ticketId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = TicketRepository;
