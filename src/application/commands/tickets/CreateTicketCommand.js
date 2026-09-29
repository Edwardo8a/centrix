const supabase = require('../../../infrastructure/db/supabaseClient');
const Ticket = require('../../../core/entities/Ticket');

class CreateTicketCommand {
  constructor({ ticketRepository, auditService }) {
    this.ticketRepository = ticketRepository;
    this.auditService = auditService;
  }

  async execute({ title, description, category, priority, department_id, userId }) {
    // La entidad de Ticket recibe los parametros que son necesarios para la base de datos
    const ticketEntity = new Ticket({ title, description, category, priority, department_id, createdBy: userId });

    // Intenta ejecutar vía función almacenada RPC para garantizar ACID estricto
    try {
      const { data, error } = await supabase.rpc('create_ticket_transaction', {
        p_title: ticketEntity.title,
        p_description: ticketEntity.description,
        p_category: ticketEntity.category,
        p_priority: ticketEntity.priority,
        p_department_id: ticketEntity.department_id,
        p_created_by: userId
      });


      if (!error && data) return data;
    } catch (rpcErr) {
      console.warn('[CreateTicketCommand] RPC call fallback to repository:', rpcErr.message);
    }

    // Fallback a repositorio + servicio de auditoría
    const createdTicket = await this.ticketRepository.create({
      title: ticketEntity.title,
      description: ticketEntity.description,
      category: ticketEntity.category,
      priority: ticketEntity.priority,
      department_id: ticketEntity.department_id,
      created_by: userId
    });

    if (this.auditService) {
      await this.auditService.logAction(userId, 'CREATE_TICKET', 'tickets', createdTicket.id);
    }

    return createdTicket;
  }
}

module.exports = CreateTicketCommand;
