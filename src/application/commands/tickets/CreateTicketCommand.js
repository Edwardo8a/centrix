const supabase = require('../../../infrastructure/db/supabaseClient');
const Ticket = require('../../../core/entities/Ticket');

class CreateTicketCommand {
  constructor({ ticketRepository, auditService }) {
    this.ticketRepository = ticketRepository;
    this.auditService = auditService;
  }

  async execute({ title, description, category, userId }) {
    const ticketEntity = new Ticket({ title, description, category, createdBy: userId });

    // Intenta ejecutar vía función almacenada RPC para garantizar ACID estricto
    try {
      const { data, error } = await supabase.rpc('create_ticket_transaction', {
        p_title: ticketEntity.title,
        p_description: ticketEntity.description,
        p_category: ticketEntity.category,
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
      status: ticketEntity.status,
      created_by: userId
    });

    if (this.auditService) {
      await this.auditService.logAction(userId, 'CREATE_TICKET', 'tickets', createdTicket.id);
    }

    return createdTicket;
  }
}

module.exports = CreateTicketCommand;
