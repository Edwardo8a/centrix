const supabase = require('../../config/supabaseClient');
const Ticket = require('../../models/Ticket');

class CreateTicketCommand {
  constructor({ ticketRepository }) {
    this.ticketRepository = ticketRepository;
  }

  async execute({ title, description, priority, department_id, userId }) {
    const ticketEntity = new Ticket({
      title,
      description,
      priority,
      department_id,
      created_by: userId
    });

    // Intenta ejecutar via funcion almacenada RPC si existe
    try {
      const { data, error } = await supabase.rpc('create_ticket_transaction', {
        p_title: ticketEntity.title,
        p_description: ticketEntity.description,
        p_priority: ticketEntity.priority,
        p_department_id: ticketEntity.department_id,
        p_created_by: userId
      });

      if (!error && data) return data;
    } catch (rpcErr) {
      console.warn('[CreateTicketCommand] RPC fallback al repositorio:', rpcErr.message);
    }

    // Persistencia mediante repositorio
    const createdTicket = await this.ticketRepository.create({
      title: ticketEntity.title,
      description: ticketEntity.description,
      priority: ticketEntity.priority,
      department_id: ticketEntity.department_id,
      created_by: userId
    });

    return createdTicket;
  }
}

module.exports = CreateTicketCommand;
